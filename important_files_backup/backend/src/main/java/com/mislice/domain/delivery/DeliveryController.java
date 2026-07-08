package com.mislice.domain.delivery;

import com.mislice.domain.delivery.dto.DeliveryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<DeliveryDto> getDeliveryByOrderId(@PathVariable UUID orderId) {
        return ResponseEntity.ok(deliveryService.getDeliveryByOrderId(orderId));
    }

    @PostMapping("/{deliveryId}/assign")
    public ResponseEntity<DeliveryDto> assignDriver(
            @PathVariable UUID deliveryId,
            @RequestParam UUID driverId) {
        return ResponseEntity.ok(deliveryService.assignDriverToDelivery(deliveryId, driverId));
    }

    @PutMapping("/{deliveryId}/status")
    public ResponseEntity<DeliveryDto> updateDeliveryStatus(
            @PathVariable UUID deliveryId,
            @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(deliveryId, status));
    }

    @PutMapping("/drivers/{driverId}/location")
    public ResponseEntity<Void> updateDriverLocation(
            @PathVariable UUID driverId,
            @RequestParam double lat,
            @RequestParam double lng) {
        deliveryService.updateDriverLocation(driverId, lat, lng);
        return ResponseEntity.ok().build();
    }
}
