package com.mislice.domain.payout;

import com.mislice.domain.payout.dto.PayoutDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payouts")
@RequiredArgsConstructor
@Tag(name = "Payouts", description = "Endpoints for managing merchant payouts")
public class PayoutController {

    private final PayoutService payoutService;

    @Operation(summary = "Get payout history for a restaurant")
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<List<PayoutDto>> getPayouts(@PathVariable("restaurantId") UUID restaurantId) {
        return ResponseEntity.ok(payoutService.getPayouts(restaurantId));
    }

    @Operation(summary = "Request a payout for a restaurant")
    @PostMapping("/request/{restaurantId}")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<PayoutDto> requestPayout(@PathVariable("restaurantId") UUID restaurantId, @RequestBody Map<String, BigDecimal> request) {
        BigDecimal amount = request.getOrDefault("amount", BigDecimal.ZERO);
        return ResponseEntity.ok(payoutService.requestPayout(restaurantId, amount));
    }
}
