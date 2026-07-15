package com.mislice.domain.user;

import com.mislice.domain.user.dto.PaymentMethodDto;
import com.mislice.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me/payment-methods")
@RequiredArgsConstructor
@Tag(name = "Saved Payment Methods", description = "Masked payment method metadata only — no raw card data")
@PreAuthorize("isAuthenticated()")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @Operation(summary = "Get the authenticated user's saved payment methods")
    @GetMapping
    public ResponseEntity<List<PaymentMethodDto>> getMethods() {
        return ResponseEntity.ok(paymentMethodService.getMethods(SecurityUtils.currentUserId()));
    }

    @Operation(summary = "Save a new (masked) payment method")
    @PostMapping
    public ResponseEntity<PaymentMethodDto> addMethod(@Valid @RequestBody PaymentMethodDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodService.addMethod(SecurityUtils.currentUserId(), dto));
    }

    @Operation(summary = "Mark a saved payment method as default")
    @PutMapping("/{id}/default")
    public ResponseEntity<PaymentMethodDto> setDefault(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(paymentMethodService.setDefault(SecurityUtils.currentUserId(), id));
    }

    @Operation(summary = "Remove a saved payment method")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMethod(@PathVariable("id") UUID id) {
        paymentMethodService.deleteMethod(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
