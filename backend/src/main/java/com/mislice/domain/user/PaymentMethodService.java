package com.mislice.domain.user;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.user.dto.PaymentMethodDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * Manages saved (masked-only) payment method metadata for the profile UI.
 * This does NOT process real charges or accept raw card numbers/CVV — it
 * only stores brand/last4/expiry so the UI can render "Visa •••• 4521".
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<PaymentMethodDto> getMethods(UUID userId) {
        return userMapper.toPaymentMethodDtos(paymentMethodRepository.findByUserIdAndDeletedFalse(userId));
    }

    @Transactional
    public PaymentMethodDto addMethod(UUID userId, PaymentMethodDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        PaymentMethod method = PaymentMethod.builder()
                .user(user)
                .brand(dto.brand())
                .last4(dto.last4())
                .expMonth(dto.expMonth())
                .expYear(dto.expYear())
                .isDefault(dto.isDefault())
                .build();

        if (dto.isDefault()) {
            unsetOtherDefaults(userId);
        }

        PaymentMethod saved = paymentMethodRepository.save(method);
        return userMapper.toDto(saved);
    }

    @Transactional
    public PaymentMethodDto setDefault(UUID userId, UUID methodId) {
        PaymentMethod method = paymentMethodRepository.findById(methodId)
                .filter(m -> m.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", methodId));

        unsetOtherDefaults(userId);
        method.setDefault(true);
        PaymentMethod saved = paymentMethodRepository.save(method);
        return userMapper.toDto(saved);
    }

    @Transactional
    public void deleteMethod(UUID userId, UUID methodId) {
        PaymentMethod method = paymentMethodRepository.findById(methodId)
                .filter(m -> m.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", methodId));
        method.setDeleted(true);
        paymentMethodRepository.save(method);
    }

    private void unsetOtherDefaults(UUID userId) {
        for (PaymentMethod m : paymentMethodRepository.findByUserIdAndDeletedFalse(userId)) {
            if (m.isDefault()) {
                m.setDefault(false);
                paymentMethodRepository.save(m);
            }
        }
    }
}
