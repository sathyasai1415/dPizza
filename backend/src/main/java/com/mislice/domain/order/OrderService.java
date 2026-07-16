package com.mislice.domain.order;

import com.mislice.common.exception.ApiException;
import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.cart.Cart;
import com.mislice.domain.cart.CartRepository;
import com.mislice.domain.coupon.Coupon;
import com.mislice.domain.order.dto.OrderDto;
import com.mislice.domain.order.dto.PlaceOrderRequest;
import com.mislice.domain.notification.OrderNotificationService;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderMapper orderMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final OrderNotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public void verifyRestaurantAccess(UUID restaurantId, UUID currentUserId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        if (restaurant.getOwner() == null || !restaurant.getOwner().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not own this restaurant");
        }
    }

    public void verifyOrderAccess(OrderDto order, UUID currentUserId, List<String> roles) {
        if (roles.contains("ROLE_ADMIN") || roles.contains("ADMIN")) {
            return;
        }
        if (order.userId().equals(currentUserId)) {
            return;
        }
        Order orderEntity = orderRepository.findById(order.id())
            .orElseThrow(() -> new ResourceNotFoundException("Order", order.id()));
        if (orderEntity.getRestaurant().getOwner() != null && 
            orderEntity.getRestaurant().getOwner().getId().equals(currentUserId)) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have access to this order");
    }

    public void verifyOrderOwnership(UUID orderId, UUID currentUserId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getRestaurant().getOwner() == null || !order.getRestaurant().getOwner().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not own the restaurant for this order");
        }
    }

    public List<OrderDto> getOrdersForUser(UUID userId) {
        return orderRepository.findByUserIdOrderByPlacedAtDesc(userId).stream()
            .map(orderMapper::toDto)
            .toList();
    }

    public List<OrderDto> getOrdersForRestaurant(UUID restaurantId) {
        return orderRepository.findByRestaurantIdOrderByPlacedAtDesc(restaurantId).stream()
            .map(orderMapper::toDto)
            .toList();
    }

    public OrderDto getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderNumber));
        return orderMapper.toDto(order);
    }

    public OrderDto placeOrder(UUID userId, PlaceOrderRequest req) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalStateException("No active cart found"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot place order with an empty cart");
        }

        Restaurant restaurant = cart.getRestaurant();
        User user = cart.getUser();

        // 1. Calculate pricing
        BigDecimal subtotal = BigDecimal.ZERO;
        for (var item : cart.getItems()) {
            BigDecimal toppingsTotal = item.getToppings().stream()
                .map(t -> t.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal itemTotal = item.getUnitPrice().add(toppingsTotal)
                .multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        if (subtotal.compareTo(restaurant.getMinimumOrder()) < 0) {
            throw new IllegalStateException("Order total does not meet the minimum order amount of " + restaurant.getMinimumOrder());
        }

        BigDecimal deliveryFee = "PICKUP".equalsIgnoreCase(req.deliveryType()) 
            ? BigDecimal.ZERO 
            : restaurant.getDeliveryFee();

        BigDecimal providerServiceFee = "PICKUP".equalsIgnoreCase(req.deliveryType())
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(1.99); // Mock standard provider fee

        BigDecimal platformServiceFee = BigDecimal.valueOf(0.99); // Flat platform fee
        BigDecimal taxRate = BigDecimal.valueOf(0.0825); // 8.25%
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tip = req.tip() != null ? req.tip() : BigDecimal.ZERO;

        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = cart.getCoupon();
        if (coupon != null) {
            if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
                discount = subtotal.multiply(coupon.getDiscountValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            } else if ("FIXED".equalsIgnoreCase(coupon.getDiscountType())) {
                discount = coupon.getDiscountValue();
            } else if ("FREE_DELIVERY".equalsIgnoreCase(coupon.getDiscountType())) {
                discount = deliveryFee;
            }
            discount = discount.min(subtotal); // Coupon discount cannot exceed subtotal
        }

        BigDecimal total = subtotal.add(deliveryFee).add(providerServiceFee).add(platformServiceFee).add(tax).add(tip).subtract(discount);

        // 2. Build order entity
        String orderNumber = "MS-" + (System.currentTimeMillis() % 100000000) + String.format("%04d", secureRandom.nextInt(10000));

        Order order = Order.builder()
            .orderNumber(orderNumber)
            .user(user)
            .restaurant(restaurant)
            .status("PLACED")
            .deliveryType(req.deliveryType())
            .deliveryProvider(req.deliveryProvider())
            .deliveryAddress(req.deliveryAddress())
            .deliveryNotes(req.deliveryNotes())
            .subtotal(subtotal)
            .deliveryFee(deliveryFee)
            .providerServiceFee(providerServiceFee)
            .platformServiceFee(platformServiceFee)
            .tax(tax)
            .tip(tip)
            .discount(discount)
            .total(total)
            .couponCode(coupon != null ? coupon.getCode() : null)
            .estimatedEtaMin(restaurant.getAverageEtaMinutes() != null ? restaurant.getAverageEtaMinutes() : 30)
            .estimatedEtaMax((restaurant.getAverageEtaMinutes() != null ? restaurant.getAverageEtaMinutes() : 30) + 15)
            .placedAt(Instant.now())
            .paymentMethod(req.paymentMethod())
            .paymentStatus("PENDING")
            .items(new ArrayList<>())
            .build();

        // Copy items
        for (var cItem : cart.getItems()) {
            String[] toppings = cItem.getToppings().stream()
                .map(t -> t.getToppingName())
                .toArray(String[]::new);

            BigDecimal toppingCost = cItem.getToppings().stream()
                .map(t -> t.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            OrderItem orderItem = OrderItem.builder()
                .order(order)
                .menuItem(cItem.getMenuItem())
                .itemName(cItem.getItemName())
                .size(cItem.getSize())
                .crust(cItem.getCrust())
                .sauce(cItem.getSauce())
                .toppings(toppings)
                .quantity(cItem.getQuantity())
                .unitPrice(cItem.getUnitPrice())
                .lineTotal(cItem.getUnitPrice().add(toppingCost).multiply(BigDecimal.valueOf(cItem.getQuantity())))
                .build();

            order.getItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // Log lifecycle transition
        OrderStatusHistory history = OrderStatusHistory.builder()
            .order(savedOrder)
            .fromStatus(null)
            .toStatus("PLACED")
            .changedBy(user.getFullName())
            .note("Order placed successfully via web checkout.")
            .createdAt(Instant.now())
            .build();
        orderStatusHistoryRepository.save(history);

        // Clear cart
        cart.getItems().clear();
        cart.setRestaurant(null);
        cart.setCoupon(null);
        cartRepository.save(cart);

        OrderDto orderDto = orderMapper.toDto(savedOrder);

        // Notify restaurant owner of new order
        notificationService.notifyNewOrder(orderDto);

        return orderDto;
    }

    public OrderDto updateOrderStatus(UUID orderId, String newStatus, String changedBy, String note) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        String oldStatus = order.getStatus();
        order.setStatus(newStatus);
        
        if ("DELIVERED".equalsIgnoreCase(newStatus)) {
            order.setPaymentStatus("PAID");
        }

        Order saved = orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
            .order(saved)
            .fromStatus(oldStatus)
            .toStatus(newStatus)
            .changedBy(changedBy)
            .note(note)
            .createdAt(Instant.now())
            .build();
        orderStatusHistoryRepository.save(history);

        OrderDto updatedOrder = orderMapper.toDto(saved);

        // Notify restaurant owner of status change
        notificationService.notifyOrderStatusChange(updatedOrder, oldStatus);

        return updatedOrder;
    }
}
