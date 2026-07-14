package com.mislice.domain.payout;

import com.mislice.domain.payout.dto.PayoutDto;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public List<PayoutDto> getPayouts(UUID restaurantId) {
        return payoutRepository.findByRestaurantIdOrderByPeriodStartDesc(restaurantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PayoutDto requestPayout(UUID restaurantId, BigDecimal amount) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        // Simulate calculating the payout from unpaid orders.
        // In a real scenario, this would query the ledger or unpaid orders.
        // For now, we trust the requested amount and calculate basic stats.
        BigDecimal platformFee = amount.multiply(new BigDecimal("0.05")); // 5% fee mock
        BigDecimal grossRevenue = amount.add(platformFee);

        Payout payout = Payout.builder()
                .restaurant(restaurant)
                .periodStart(LocalDate.now().minusDays(7))
                .periodEnd(LocalDate.now())
                .orderCount(10) // mock value
                .grossRevenue(grossRevenue)
                .platformFee(platformFee)
                .netPayout(amount)
                .status("PENDING")
                .build();

        Payout saved = payoutRepository.save(payout);
        return toDto(saved);
    }

    private PayoutDto toDto(Payout payout) {
        return PayoutDto.builder()
                .id(payout.getId())
                .restaurantId(payout.getRestaurant().getId())
                .periodStart(payout.getPeriodStart())
                .periodEnd(payout.getPeriodEnd())
                .orderCount(payout.getOrderCount())
                .grossRevenue(payout.getGrossRevenue())
                .platformFee(payout.getPlatformFee())
                .netPayout(payout.getNetPayout())
                .status(payout.getStatus())
                .paidAt(payout.getPaidAt())
                .createdAt(payout.getCreatedAt())
                .build();
    }
}
