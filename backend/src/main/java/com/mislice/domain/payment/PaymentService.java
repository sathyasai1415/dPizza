package com.mislice.domain.payment;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.order.Order;
import com.mislice.domain.order.OrderRepository;
import com.mislice.domain.payment.dto.StripeIntentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;

    public StripeIntentResponse createStripeIntent(UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        String paymentIntentId = "pi_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String clientSecret = paymentIntentId + "_secret_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        Payment payment = Payment.builder()
            .order(order)
            .provider("STRIPE")
            .method("CARD")
            .status("PENDING")
            .amount(order.getTotal())
            .currency("USD")
            .providerRef(paymentIntentId)
            .build();

        Payment savedPayment = paymentRepository.save(payment);

        PaymentTransaction transaction = PaymentTransaction.builder()
            .payment(savedPayment)
            .type("AUTHORIZE")
            .amount(order.getTotal())
            .status("PENDING")
            .providerRef(paymentIntentId)
            .rawPayload(Map.of("clientSecret", clientSecret, "created_at", Instant.now().toString()))
            .createdAt(Instant.now())
            .build();

        paymentTransactionRepository.save(transaction);

        return new StripeIntentResponse(clientSecret, paymentIntentId, order.getTotal());
    }

    public void confirmStripePayment(String paymentIntentId) {
        // Find payment by provider reference (indexed lookup, not a full-table scan)
        Payment payment = paymentRepository.findByProviderRef(paymentIntentId)
            .orElseThrow(() -> new ResourceNotFoundException("PaymentIntent", paymentIntentId));

        payment.setStatus("CAPTURED");
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setPaymentStatus("PAID");
        orderRepository.save(order);

        PaymentTransaction captureTx = PaymentTransaction.builder()
            .payment(payment)
            .type("CAPTURE")
            .amount(payment.getAmount())
            .status("SUCCESS")
            .providerRef(paymentIntentId)
            .rawPayload(Map.of("captured_at", Instant.now().toString()))
            .createdAt(Instant.now())
            .build();

        paymentTransactionRepository.save(captureTx);
    }
}
