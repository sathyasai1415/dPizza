package com.mislice.domain.payment;

import com.mislice.domain.payment.dto.StripeIntentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/stripe/create-intent")
    public ResponseEntity<StripeIntentResponse> createStripeIntent(@RequestParam UUID orderId) {
        return ResponseEntity.ok(paymentService.createStripeIntent(orderId));
    }

    @PostMapping("/stripe/confirm")
    public ResponseEntity<Void> confirmStripePayment(@RequestParam String paymentIntentId) {
        paymentService.confirmStripePayment(paymentIntentId);
        return ResponseEntity.ok().build();
    }
}
