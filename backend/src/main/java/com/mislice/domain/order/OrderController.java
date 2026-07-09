package com.mislice.domain.order;

import com.mislice.domain.order.dto.OrderDto;
import com.mislice.domain.order.dto.PlaceOrderRequest;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> placeOrder(@RequestBody PlaceOrderRequest req) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(orderService.placeOrder(userId, req));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(orderService.getOrdersForUser(userId));
    }

    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN')")
    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<List<OrderDto>> getRestaurantOrders(@PathVariable UUID restaurantId) {
        // Verify the current user owns this restaurant
        orderService.verifyRestaurantAccess(restaurantId, SecurityUtils.currentUserId());
        return ResponseEntity.ok(orderService.getOrdersForRestaurant(restaurantId));
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDto> getOrderByNumber(@PathVariable String orderNumber) {
        // Verify the current user is the order owner, the restaurant owner, or an admin
        OrderDto order = orderService.getOrderByNumber(orderNumber);
        orderService.verifyOrderAccess(order, SecurityUtils.currentUserId(), SecurityUtils.currentUserRoles());
        return ResponseEntity.ok(order);
    }

    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN')")
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam String status,
            @RequestParam(required = false) String note) {
        UUID currentUserId = SecurityUtils.currentUserId();
        String changedBy = SecurityUtils.currentUserEmail();
        // Verify the user owns the restaurant that this order belongs to
        orderService.verifyOrderOwnership(orderId, currentUserId);
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status, changedBy, note));
    }
}
