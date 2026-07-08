package com.mislice.domain.loyalty;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.order.Order;
import com.mislice.domain.order.OrderRepository;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LoyaltyService {

    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public LoyaltyAccount getOrCreateAccount(UUID userId) {
        return loyaltyAccountRepository.findByUserId(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                LoyaltyAccount account = LoyaltyAccount.builder()
                    .user(user)
                    .points(0)
                    .lifetimePoints(0)
                    .referralCode("SLICE" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase())
                    .build();
                return loyaltyAccountRepository.save(account);
            });
    }

    public void earnPointsForOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        LoyaltyAccount account = getOrCreateAccount(userId);

        // Earn 10 points per dollar spent
        int pointsEarned = order.getTotal().multiply(BigDecimal.valueOf(10)).intValue();

        account.setPoints(account.getPoints() + pointsEarned);
        account.setLifetimePoints(account.getLifetimePoints() + pointsEarned);
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
            .account(account)
            .type("EARN")
            .points(pointsEarned)
            .description("Points earned on order #" + order.getOrderNumber())
            .order(order)
            .createdAt(Instant.now())
            .build();

        loyaltyTransactionRepository.save(transaction);
    }

    public void redeemPoints(UUID userId, int points, String description) {
        LoyaltyAccount account = getOrCreateAccount(userId);

        if (account.getPoints() < points) {
            throw new IllegalArgumentException("Insufficient loyalty points balance. Has: " + account.getPoints() + ", Needs: " + points);
        }

        account.setPoints(account.getPoints() - points);
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction transaction = LoyaltyTransaction.builder()
            .account(account)
            .type("REDEEM")
            .points(points)
            .description(description)
            .createdAt(Instant.now())
            .build();

        loyaltyTransactionRepository.save(transaction);
    }
}
