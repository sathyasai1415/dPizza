package com.mislice.domain.compare;

import com.mislice.domain.compare.dto.*;
import com.mislice.domain.coupon.CouponRepository;
import com.mislice.domain.coupon.CouponMapper;
import com.mislice.domain.coupon.dto.CouponDto;
import com.mislice.domain.menu.MenuItem;
import com.mislice.domain.menu.MenuItemRepository;
import com.mislice.domain.menu.StandardPizzaProfile;
import com.mislice.domain.menu.StandardPizzaProfileRepository;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import com.mislice.domain.search.SearchIntentParserService;
import com.mislice.domain.search.StructuredSearchQuery;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChainCompareService {

    private final ChainRepository chainRepository;
    private final CouponRepository couponRepository;
    private final ChainMapper chainMapper;
    private final CouponMapper couponMapper;
    private final MenuItemRepository menuItemRepository;
    private final StandardPizzaProfileRepository standardPizzaProfileRepository;
    private final SearchIntentParserService searchIntentParserService;
    private final RestaurantRepository restaurantRepository;

    public List<QuoteDto> calculateSearchQuotes(String query, String deliveryType) {
        StructuredSearchQuery parsedQuery = searchIntentParserService.parseIntent(query);
        String lowerQuery = query.toLowerCase();

        // 1. Fetch matching restaurants if any part of the query matches a restaurant name
        List<Restaurant> allRestaurants = restaurantRepository.findByDeletedFalse();
        List<Restaurant> matchingRestaurants = allRestaurants.stream()
            .filter(r -> lowerQuery.contains(r.getName().toLowerCase()) || r.getName().toLowerCase().contains(lowerQuery))
            .collect(Collectors.toList());

        List<MenuItem> allItems;
        if (parsedQuery.getCategory() != null) {
            StandardPizzaProfile profile = standardPizzaProfileRepository.findByCategoryIgnoreCase(parsedQuery.getCategory())
                .orElse(null);
            if (profile != null) {
                allItems = menuItemRepository.findByStandardProfileIdAndDeletedFalse(profile.getId());
            } else {
                allItems = new ArrayList<>();
            }
        } else {
            // fallback: return everything if no category is parsed (could be large)
            allItems = menuItemRepository.findAll();
        }

        // 2. Filter menu items by matching restaurant IDs if any matching restaurants were found
        if (!matchingRestaurants.isEmpty()) {
            List<UUID> matchingIds = matchingRestaurants.stream().map(Restaurant::getId).collect(Collectors.toList());
            allItems = allItems.stream()
                .filter(item -> matchingIds.contains(item.getRestaurant().getId()))
                .collect(Collectors.toList());
        }

        // Apply size filter if specified, else default to "14"" for fair price sorting, unless they didn't sort by price.
        String targetSize = parsedQuery.getSize();
        if (targetSize == null && parsedQuery.getSortType() == StructuredSearchQuery.SortType.CHEAPEST) {
            targetSize = "14\""; // Default to Large for fair price comparison if unspecified
        }

        if (targetSize != null) {
            final String fTargetSize = targetSize;
            allItems = allItems.stream()
                .filter(item -> item.getStandardSize() != null && 
                        (item.getStandardSize().getMeasurementInches() + "\"").equals(fTargetSize))
                .collect(Collectors.toList());
        }

        List<QuoteDto> quotes = new ArrayList<>();
        for (MenuItem item : allItems) {
            Restaurant rest = item.getRestaurant();
            if (!rest.isAcceptingOrders()) continue;

            BigDecimal basePrice = item.getBasePrice();
            BigDecimal toppingsCost = BigDecimal.ZERO;

            List<DeliveryProviderOptionDto> options = new ArrayList<>();
            if ("delivery".equalsIgnoreCase(deliveryType)) {
                BigDecimal subtotal = basePrice.add(toppingsCost);
                BigDecimal deliveryFee = rest.getDeliveryFee() != null ? rest.getDeliveryFee() : BigDecimal.valueOf(3.99);
                
                // Price limit filter
                if (parsedQuery.getMaxPrice() != null) {
                    if (subtotal.add(deliveryFee).compareTo(parsedQuery.getMaxPrice()) > 0) {
                        continue; // skip if over budget
                    }
                }

                BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.0825)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tip = subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal grandTotal = subtotal.add(deliveryFee).add(tax).add(tip);
                
                int estMin = rest.getAverageEtaMinutes() != null ? rest.getAverageEtaMinutes() : 25;
                
                options.add(new DeliveryProviderOptionDto(
                    "store", "Store Delivery",
                    new PriceBreakdownDto(subtotal, deliveryFee, BigDecimal.ZERO, tax, tip, BigDecimal.ZERO, grandTotal),
                    estMin, estMin + 10, new ArrayList<>(), Collections.emptyList()
                ));
            }

            if (options.isEmpty()) continue;

            String nativeSizeStr = item.getStandardSize() != null ? item.getStandardSize().getMeasurementInches() + "\"" : "Large";

            quotes.add(new QuoteDto(
                rest.getId().toString(),
                rest.getName(),
                rest.getBrandColor() != null ? rest.getBrandColor() : "#222222",
                basePrice,
                toppingsCost,
                rest.getRatingAvg() != null ? rest.getRatingAvg().doubleValue() : 4.0,
                new ArrayList<>(), 
                "1.5 miles",
                new ArrayList<>(),
                options,
                "store",
                "store",
                "store",
                item.getName(), 
                nativeSizeStr 
            ));
        }

        // Apply Sorting
        if (parsedQuery.getSortType() == StructuredSearchQuery.SortType.CHEAPEST) {
            quotes.sort((a, b) -> a.deliveryOptions().get(0).priceBreakdown().grandTotal().compareTo(b.deliveryOptions().get(0).priceBreakdown().grandTotal()));
        } else if (parsedQuery.getSortType() == StructuredSearchQuery.SortType.FASTEST) {
            quotes.sort((a, b) -> Integer.compare(a.deliveryOptions().get(0).estimatedTimeMin(), b.deliveryOptions().get(0).estimatedTimeMin()));
        }
        
        return quotes;
    }

    public List<QuoteDto> calculateQuickQuotes(String intent, String deliveryType) {
        StandardPizzaProfile profile = standardPizzaProfileRepository.findByCategoryIgnoreCase(intent)
            .orElseThrow(() -> new IllegalArgumentException("Unknown pizza category: " + intent));

        List<MenuItem> items = menuItemRepository.findByStandardProfileIdAndDeletedFalse(profile.getId());
        List<QuoteDto> quotes = new ArrayList<>();

        for (MenuItem item : items) {
            Restaurant rest = item.getRestaurant();
            if (!rest.isAcceptingOrders()) continue;

            BigDecimal basePrice = item.getBasePrice();
            BigDecimal toppingsCost = BigDecimal.ZERO; // Built-in to the menu item

            List<DeliveryProviderOptionDto> options = new ArrayList<>();
            // Assuming store delivery option for local restaurants
            if ("delivery".equalsIgnoreCase(deliveryType)) {
                BigDecimal markupPrice = basePrice;
                BigDecimal subtotal = markupPrice.add(toppingsCost);
                BigDecimal deliveryFee = rest.getDeliveryFee() != null ? rest.getDeliveryFee() : BigDecimal.valueOf(3.99);
                BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.0825)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal tip = subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal grandTotal = subtotal.add(deliveryFee).add(tax).add(tip);
                
                int estMin = rest.getAverageEtaMinutes() != null ? rest.getAverageEtaMinutes() : 25;
                
                options.add(new DeliveryProviderOptionDto(
                    "store", "Store Delivery",
                    new PriceBreakdownDto(subtotal, deliveryFee, BigDecimal.ZERO, tax, tip, BigDecimal.ZERO, grandTotal),
                    estMin, estMin + 10, new ArrayList<>(), Collections.emptyList()
                ));
            }

            if (options.isEmpty()) continue;

            String nativeSizeStr = item.getStandardSize() != null ? item.getStandardSize().getMeasurementInches() + "\"" : "Large";

            quotes.add(new QuoteDto(
                rest.getId().toString(),
                rest.getName(),
                rest.getBrandColor() != null ? rest.getBrandColor() : "#222222",
                basePrice,
                toppingsCost,
                rest.getRatingAvg() != null ? rest.getRatingAvg().doubleValue() : 4.0,
                new ArrayList<>(), // No reviews for now
                "1.5 miles",
                new ArrayList<>(),
                options,
                "store",
                "store",
                "store",
                item.getName(), // Native Menu Name
                nativeSizeStr // Native Size
            ));
        }

        quotes.sort((a, b) -> a.deliveryOptions().get(0).priceBreakdown().grandTotal().compareTo(b.deliveryOptions().get(0).priceBreakdown().grandTotal()));
        return quotes;
    }

    private ComparePizzaConfig mapIntentToConfig(String intent) {
        return switch (intent) {
            case "pepperoni" -> new ComparePizzaConfig("Large", "Hand Tossed", "Robust Inspired Tomato Sauce", 
                    List.of("Mozzarella"), List.of("Pepperoni"), List.of(), List.of(), 1);
            case "meat_lovers", "carnivore", "ultimate_meat" -> new ComparePizzaConfig("Large", "Hand Tossed", "Robust Inspired Tomato Sauce", 
                    List.of("Mozzarella"), List.of("Pepperoni", "Sausage", "Bacon", "Ham", "Beef"), List.of(), List.of(), 1);
            case "hawaiian" -> new ComparePizzaConfig("Large", "Hand Tossed", "Robust Inspired Tomato Sauce", 
                    List.of("Mozzarella"), List.of("Ham", "Bacon"), List.of("Pineapple"), List.of(), 1);
            case "bbq_chicken" -> new ComparePizzaConfig("Large", "Hand Tossed", "BBQ Sauce", 
                    List.of("Mozzarella", "Cheddar"), List.of("Chicken", "Bacon"), List.of("Onions"), List.of(), 1);
            case "cheese", "margherita" -> new ComparePizzaConfig("Large", "Hand Tossed", "Robust Inspired Tomato Sauce", 
                    List.of("Mozzarella", "Parmesan"), List.of(), List.of(), List.of(), 1);
            default -> new ComparePizzaConfig("Large", "Hand Tossed", "Robust Inspired Tomato Sauce", 
                    List.of("Mozzarella"), List.of(), List.of(), List.of(), 1);
        };
    }

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
                null,
                null,
                null
            ));
        }

        // Add quotes for local independent approved restaurants dynamically
        List<Restaurant> localRestaurants = restaurantRepository.findByApprovedTrueAndDeletedFalse();
        for (Restaurant rest : localRestaurants) {
            // Calculate base price dynamically based on size
            BigDecimal sizeBase = BigDecimal.valueOf(14.99); // fallback default
            if ("Personal".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(8.99);
            } else if ("Small".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(10.99);
            } else if ("Medium".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(12.99);
            } else if ("Large".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(14.99);
            } else if ("Extra Large".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(17.99);
            } else if ("Party".equalsIgnoreCase(config.size())) {
                sizeBase = BigDecimal.valueOf(24.99);
            }
            
            // Apply custom crust up-charge if any
            BigDecimal crustPremium = BigDecimal.ZERO;
            if (config.crust() != null) {
                String crust = config.crust().toLowerCase();
                if (crust.contains("pan") || crust.contains("deep dish") || crust.contains("detroit")) {
                    crustPremium = BigDecimal.valueOf(2.00);
                } else if (crust.contains("stuffed") || crust.contains("chicago")) {
                    crustPremium = BigDecimal.valueOf(2.50);
                } else if (crust.contains("gluten-free") || crust.contains("cauliflower")) {
                    crustPremium = BigDecimal.valueOf(2.00);
                }
            }
            
            BigDecimal basePrice = sizeBase.add(crustPremium).multiply(BigDecimal.valueOf(config.quantity()));

            // Calculate toppings count (cheese, meats, veggies, extras)
            int toppingsCount = 0;
            if (config.cheese() != null) toppingsCount += config.cheese().size();
            if (config.meats() != null) toppingsCount += config.meats().size();
            if (config.veggies() != null) toppingsCount += config.veggies().size();
            if (config.extras() != null) toppingsCount += config.extras().size();

            // Subtract 1 free cheese
            if (config.cheese() != null && !config.cheese().isEmpty()) {
                toppingsCount = Math.max(0, toppingsCount - 1);
            }

            BigDecimal toppingPrice = BigDecimal.valueOf(1.50); // local stores standard topping price
            BigDecimal toppingsCost = toppingPrice.multiply(BigDecimal.valueOf(toppingsCount)).multiply(BigDecimal.valueOf(config.quantity()));

            List<DeliveryProviderOptionDto> options = new ArrayList<>();
            BigDecimal subtotal = basePrice.add(toppingsCost);
            BigDecimal deliveryFee = rest.getDeliveryFee() != null ? rest.getDeliveryFee() : BigDecimal.valueOf(3.99);
            BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.0825)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tip = subtotal.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal grandTotal = subtotal.add(deliveryFee).add(tax).add(tip);
            int estMin = rest.getAverageEtaMinutes() != null ? rest.getAverageEtaMinutes() : 25;

            // Generate delivery option
            if ("delivery".equalsIgnoreCase(deliveryType)) {
                options.add(new DeliveryProviderOptionDto(
                    "store", "Store Delivery",
                    new PriceBreakdownDto(subtotal, deliveryFee, BigDecimal.ZERO, tax, tip, BigDecimal.ZERO, grandTotal),
                    estMin, estMin + 10, new ArrayList<>(), Collections.emptyList()
                ));
            } else {
                options.add(new DeliveryProviderOptionDto(
                    "pickup", "Pickup",
                    new PriceBreakdownDto(subtotal, BigDecimal.ZERO, BigDecimal.ZERO, tax, BigDecimal.ZERO, BigDecimal.ZERO, subtotal.add(tax)),
                    estMin - 10, estMin, new ArrayList<>(), Collections.emptyList()
                ));
            }

            if (options.isEmpty()) continue;

            quotes.add(new QuoteDto(
                rest.getId().toString(),
                rest.getName(),
                rest.getBrandColor() != null ? rest.getBrandColor() : "#FF2400",
                basePrice,
                toppingsCost,
                rest.getRatingAvg() != null ? rest.getRatingAvg().doubleValue() : 4.5,
                new ArrayList<>(), // no reviews
                "1.8 miles",
                new ArrayList<>(),
                options,
                "store",
                "store",
                null,
                "Custom Pizza",
                config.size()
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
                cheapestQuote.fastestOptionId(), cheapestQuote.cheapestOptionId(),
                cheapestQuote.nativeMenuName(), cheapestQuote.nativeSize()
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
