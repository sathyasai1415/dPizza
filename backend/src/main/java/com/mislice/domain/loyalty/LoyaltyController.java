package com.mislice.domain.loyalty;

import com.mislice.domain.loyalty.dto.LoyaltyAccountDto;
import com.mislice.domain.loyalty.dto.LoyaltyTransactionDto;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;

    @GetMapping
    public ResponseEntity<LoyaltyAccountDto> getMyAccount() {
        UUID userId = SecurityUtils.currentUserId();
        LoyaltyAccount account = loyaltyService.getOrCreateAccount(userId);
        return ResponseEntity.ok(new LoyaltyAccountDto(
            account.getId(),
            account.getPoints(),
            account.getLifetimePoints(),
            account.getReferralCode()
        ));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<LoyaltyTransactionDto>> getMyTransactions() {
        UUID userId = SecurityUtils.currentUserId();
        LoyaltyAccount account = loyaltyService.getOrCreateAccount(userId);
        List<LoyaltyTransactionDto> txs = loyaltyTransactionRepository.findByAccountIdOrderByCreatedAtDesc(account.getId()).stream()
            .map(t -> new LoyaltyTransactionDto(
                t.getId(),
                t.getType(),
                t.getPoints(),
                t.getDescription(),
                t.getCreatedAt()
            ))
            .toList();
        return ResponseEntity.ok(txs);
    }

    @PostMapping("/redeem")
    public ResponseEntity<Void> redeemPoints(
            @RequestParam int points,
            @RequestParam String description) {
        UUID userId = SecurityUtils.currentUserId();
        loyaltyService.redeemPoints(userId, points, description);
        return ResponseEntity.ok().build();
    }
}
