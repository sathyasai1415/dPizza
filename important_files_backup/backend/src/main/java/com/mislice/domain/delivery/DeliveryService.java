package com.mislice.domain.delivery;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.delivery.dto.DeliveryDto;
import com.mislice.domain.loyalty.LoyaltyService;
import com.mislice.domain.order.Order;
import com.mislice.domain.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final DeliveryMapper deliveryMapper;
    private final LoyaltyService loyaltyService;

    public DeliveryDto getDeliveryByOrderId(UUID orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
            .orElseGet(() -> {
                Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
                Delivery del = Delivery.builder()
                    .order(order)
                    .status("PENDING")
                    .build();
                return deliveryRepository.save(del);
            });
        return deliveryMapper.toDto(delivery);
    }

    public DeliveryDto assignDriverToDelivery(UUID deliveryId, UUID driverId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
            .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));

        delivery.setDriver(driver);
        delivery.setStatus("ASSIGNED");
        delivery.setAssignedAt(Instant.now());
        delivery.setEtaMinutes(20); // Default simulated eta

        // Propagate status back to Order
        Order order = delivery.getOrder();
        order.setStatus("OUT_FOR_DELIVERY");
        orderRepository.save(order);

        Delivery saved = deliveryRepository.save(delivery);
        return deliveryMapper.toDto(saved);
    }

    public DeliveryDto updateDeliveryStatus(UUID deliveryId, String status) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
            .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.setStatus(status);
        if ("PICKED_UP".equalsIgnoreCase(status)) {
            delivery.setPickedUpAt(Instant.now());
        } else if ("DELIVERED".equalsIgnoreCase(status)) {
            delivery.setDeliveredAt(Instant.now());
            // Update order payment and delivery status
            Order order = delivery.getOrder();
            order.setStatus("DELIVERED");
            order.setPaymentStatus("PAID");
            orderRepository.save(order);

            // Earn reward points for customer
            try {
                loyaltyService.earnPointsForOrder(order.getUser().getId(), order.getId());
            } catch (Exception e) {
                // Ignore loyalty record failure in testing
            }
        }

        Delivery saved = deliveryRepository.save(delivery);
        return deliveryMapper.toDto(saved);
    }

    public void updateDriverLocation(UUID driverId, double lat, double lng) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        driver.setCurrentLat(lat);
        driver.setCurrentLng(lng);
        driverRepository.save(driver);
    }
}
