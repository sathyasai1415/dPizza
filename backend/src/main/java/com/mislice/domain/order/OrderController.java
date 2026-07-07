package com.mislice.domain.order;

import com.mislice.domain.order.dto.OrderDto;
import com.mislice.domain.order.dto.PlaceOrderRequest;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<List<OrderDto>> getRestaurantOrders(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(orderService.getOrdersForRestaurant(restaurantId));
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDto> getOrderByNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getOrderByNumber(orderNumber));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam String status,
            @RequestParam(required = false, defaultValue = "System") String changedBy,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status, changedBy, note));
    }
}
