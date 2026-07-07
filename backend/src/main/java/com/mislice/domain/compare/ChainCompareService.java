package com.mislice.domain.compare;

import com.mislice.domain.compare.dto.*;
import com.mislice.domain.coupon.CouponRepository;
import com.mislice.domain.coupon.CouponMapper;
import com.mislice.domain.coupon.dto.CouponDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChainCompareService {

    private final ChainRepository chainRepository;
    private final CouponRepository couponRepository;
    private final ChainMapper chainMapper;
    private final CouponMapper couponMapper;

    public List<QuoteDto> calculateQuotes(ComparePizzaConfig config, String deliveryType) {
        List<Chain> chains = chainRepository.findAllByOrderBySortOrderAsc();
        List<QuoteDto> quotes = new ArrayList<>();

        for (Chain chain : chains) {
            // Calculate base price
            BigDecimal sizeBase = chain.getBasePrices().getOrDefault(config.size(), BigDecimal.valueOf(15.99));
            BigDecimal crustPremium = chain.getCrustPremiums().getOrDefault(config.crust(), BigDecimal.ZERO);
            BigDecimal basePrice = sizeBase.add(crustPremium).multiply(BigDecimal.valueOf(config.quantity()));

            // Calculate toppings count (cheese, meats, veggies, extras)
            int toppingsCount = 0;
            if (config.cheese() != null) toppingsCount += config.cheese().size();
            if (config.meats() != null) toppingsCount += config.meats().size();
            if (config.veggies() != null) toppingsCount += config.veggies().size();
            if (config.extras() != null) toppingsCount += config.extras().size();

            // Subtract 1 free cheese if cheese is added
            if (config.cheese() != null && !config.cheese().isEmpty()) {
                toppingsCount = Math.max(0, toppingsCount - 1);
            }

            BigDecimal toppingsCost = chain.getToppingPrice()
                .multiply(BigDecimal.valueOf(toppingsCount))
                .multiply(BigDecimal.valueOf(config.quantity()));

            List<DeliveryProviderOptionDto> options = new ArrayList<>();

            // 1. Pickup Option
            if ("pickup".equalsIgnoreCase(deliveryType) && chain.isSupportsPickup()) {
                options.add(createOption(chain, "pickup", "Pickup", basePrice, toppingsCost, false));
            }
            
            // 2. Store Delivery Option
            if ("delivery".equalsIgnoreCase(deliveryType) && chain.isSupportsStoreDelivery()) {
                options.add(createOption(chain, "store", "Store Delivery", basePrice, toppingsCost, false));
            }

            // 3. Third-party Delivery Options
            if ("delivery".equalsIgnoreCase(deliveryType)) {
                if (chain.isSupportsDoordash()) {
                    options.add(createOption(chain, "doordash", "DoorDash", basePrice, toppingsCost, true));
                }
                if (chain.isSupportsUbereats()) {
                    options.add(createOption(chain, "ubereats", "UberEats", basePrice, toppingsCost, true));
                }
                if (chain.isSupportsGrubhub()) {
                    options.add(createOption(chain, "grubhub", "GrubHub", basePrice, toppingsCost, true));
                }
            }

            if (options.isEmpty()) {
                continue;
            }

            // Determine cheapest/fastest options for this chain
            String cheapestId = null;
            String fastestId = null;
            BigDecimal minTotal = BigDecimal.valueOf(Double.MAX_VALUE);
            int minTime = Integer.MAX_VALUE;

            for (var opt : options) {
                if (opt.priceBreakdown().grandTotal().compareTo(minTotal) < 0) {
                    minTotal = opt.priceBreakdown().grandTotal();
                    cheapestId = opt.providerId();
                }
                if (opt.estimatedTimeMin() < minTime) {
                    minTime = opt.estimatedTimeMin();
                    fastestId = opt.providerId();
                }
            }

            // Apply badges to options
            List<DeliveryProviderOptionDto> badgedOptions = new ArrayList<>();
            for (var opt : options) {
                List<String> optionBadges = new ArrayList<>();
                if (opt.providerId().equals(cheapestId)) {
                    optionBadges.add("🏆 Cheapest Delivery");
                }
                if (opt.providerId().equals(fastestId) && !opt.providerId().equals(cheapestId)) {
                    optionBadges.add("⚡ Fastest Arrival");
                }
                badgedOptions.add(new DeliveryProviderOptionDto(
                    opt.providerId(), opt.providerName(), opt.priceBreakdown(),
                    opt.estimatedTimeMin(), opt.estimatedTimeMax(), optionBadges, opt.availableCoupons()
                ));
            }

            List<ChainReviewDto> reviewDtos = chain.getReviews().stream()
                .map(chainMapper::toDto)
                .toList();

            double avgRating = chain.getReviews().isEmpty() ? 0.0 :
                chain.getReviews().stream().mapToInt(ChainReview::getRating).average().orElse(0.0);

            quotes.add(new QuoteDto(
                chain.getId().toString(),
                chain.getName(),
                chain.getColor(),
                basePrice,
                toppingsCost,
                avgRating,
                reviewDtos,
                chain.getDistanceLabel() != null ? chain.getDistanceLabel() : "1.0 miles",
                new ArrayList<>(),
                badgedOptions,
                cheapestId,
                fastestId,
                null
            ));
        }

        // Sort quotes primarily by cheapest available delivery option
        quotes.sort((a, b) -> {
            BigDecimal minA = a.deliveryOptions().stream().map(o -> o.priceBreakdown().grandTotal()).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            BigDecimal minB = b.deliveryOptions().stream().map(o -> o.priceBreakdown().grandTotal()).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            return minA.compareTo(minB);
        });

        // Add "Best Value" badge to the overall cheapest quote
        if (!quotes.isEmpty()) {
            QuoteDto cheapestQuote = quotes.get(0);
            List<String> quoteBadges = new ArrayList<>(cheapestQuote.badges());
            quoteBadges.add("Best Value");

            quotes.set(0, new QuoteDto(
                cheapestQuote.chainId(), cheapestQuote.chainName(), cheapestQuote.logoColor(),
                cheapestQuote.basePrice(), cheapestQuote.toppingsCost(), cheapestQuote.rating(),
                cheapestQuote.reviews(), cheapestQuote.distance(), quoteBadges,
                cheapestQuote.deliveryOptions(), cheapestQuote.cheapestOptionId(),
                cheapestQuote.fastestOptionId(), cheapestQuote.cheapestOptionId()
            ));
        }

        return quotes;
    }

    private DeliveryProviderOptionDto createOption(Chain chain, String providerId, String providerName,
                                                    BigDecimal basePrice, BigDecimal toppingsCost, boolean isThirdParty) {
        BigDecimal markupPrice = basePrice;
        BigDecimal markupToppings = toppingsCost;

        if (isThirdParty) {
            markupPrice = basePrice.multiply(BigDecimal.valueOf(1.20)).setScale(2, RoundingMode.HALF_UP);
            markupToppings = toppingsCost.multiply(BigDecimal.valueOf(1.20)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal subtotal = markupPrice.add(markupToppings);
        BigDecimal deliveryFee = BigDecimal.ZERO;
        BigDecimal serviceFee = BigDecimal.ZERO;

        int estMin = 15;
        int estMax = 25;

        if ("pickup".equals(providerId)) {
            // pickup
        } else if (!isThirdParty) {
            deliveryFee = chain.getStoreDeliveryFee();
            estMin = 25;
            estMax = 35;
        } else {
            if ("doordash".equals(providerId)) {
                deliveryFee = BigDecimal.valueOf(4.00);
                estMin = 22;
                estMax = 32;
            } else if ("ubereats".equals(providerId)) {
                deliveryFee = BigDecimal.valueOf(5.00);
                estMin = 28;
                estMax = 38;
            } else if ("grubhub".equals(providerId)) {
                deliveryFee = BigDecimal.valueOf(3.49);
                estMin = 26;
                estMax = 36;
            }
            serviceFee = subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.0825)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tip = "pickup".equals(providerId) ? BigDecimal.ZERO : subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(deliveryFee).add(serviceFee).add(tax).add(tip);

        // Fetch coupons available for this provider from DB
        List<CouponDto> coupons = Collections.emptyList(); // can load from CouponRepository filtered by provider

        return new DeliveryProviderOptionDto(
            providerId,
            providerName,
            new PriceBreakdownDto(subtotal, deliveryFee, serviceFee, tax, tip, BigDecimal.ZERO, grandTotal),
            estMin,
            estMax,
            new ArrayList<>(),
            coupons
        );
    }
}
