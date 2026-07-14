package com.mislice.domain.restaurant;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.restaurant.dto.DealDto;
import com.mislice.domain.restaurant.dto.DeliveryZoneDto;
import com.mislice.domain.restaurant.dto.RestaurantDto;
import com.mislice.domain.restaurant.dto.RestaurantHoursDto;
import com.mislice.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantHoursRepository hoursRepository;
    private final DeliveryZoneRepository deliveryZoneRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final RestaurantMapper restaurantMapper;

    @Cacheable(value = "restaurants", key = "#city != null ? #city : 'all'")
    public List<RestaurantDto> getApprovedRestaurants(String city) {
        List<Restaurant> list;
        if (city != null && !city.trim().isEmpty()) {
            list = restaurantRepository.findByCityAndApprovedTrueAndDeletedFalse(city);
        } else {
            list = restaurantRepository.findByApprovedTrueAndDeletedFalse();
        }
        return restaurantMapper.toDtoList(list);
    }

    @Cacheable(value = "restaurant_details", key = "#slug")
    public RestaurantDto getRestaurantBySlug(String slug) {
        Restaurant restaurant = restaurantRepository.findBySlugAndDeletedFalse(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", slug));
        return restaurantMapper.toDto(restaurant);
    }

    @Cacheable(value = "restaurant_details", key = "#id")
    public RestaurantDto getRestaurantById(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", id));
        return restaurantMapper.toDto(restaurant);
    }

    public List<String> getApprovedCities() {
        return restaurantRepository.findDistinctCities();
    }

    @Transactional
    @CacheEvict(value = "restaurants", allEntries = true)
    public RestaurantDto applyForRestaurant(RestaurantDto dto, UUID ownerId) {
        Restaurant restaurant = restaurantMapper.toEntity(dto);
        restaurant.setOwner(userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", ownerId)));
        restaurant.setApplicationStatus("SUBMITTED");
        restaurant.setSubmittedAt(Instant.now());
        restaurant.setApproved(false);
        restaurant.setSetupComplete(false);

        Restaurant saved = restaurantRepository.save(restaurant);
        return restaurantMapper.toDto(saved);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "restaurants", allEntries = true),
        @CacheEvict(value = "restaurant_details", allEntries = true)
    })
    public RestaurantDto updateRestaurant(UUID id, RestaurantDto dto) {
        Restaurant existing = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", id));
        
        existing.setName(dto.getName());
        existing.setTagline(dto.getTagline());
        existing.setDescription(dto.getDescription());
        existing.setPhone(dto.getPhone());
        existing.setAddressLine(dto.getAddressLine());
        existing.setCity(dto.getCity());
        existing.setState(dto.getState());
        existing.setPostalCode(dto.getPostalCode());
        existing.setLatitude(dto.getLatitude());
        existing.setLongitude(dto.getLongitude());
        existing.setLogoUrl(dto.getLogoUrl());
        existing.setBrandColor(dto.getBrandColor());
        existing.setEmoji(dto.getEmoji());
        existing.setPriceRange(dto.getPriceRange());
        existing.setNeighborhood(dto.getNeighborhood());
        existing.setWebsite(dto.getWebsite());
        existing.setTags(dto.getTags());
        existing.setBadges(dto.getBadges());
        existing.setPopularItems(dto.getPopularItems());
        existing.setDeliveryPartners(dto.getDeliveryPartners());

        // Operational settings managed from the owner dashboard
        existing.setAcceptingOrders(dto.isAcceptingOrders());
        if (dto.getDeliveryFee() != null) existing.setDeliveryFee(dto.getDeliveryFee());
        if (dto.getDeliveryRadiusMiles() != null) existing.setDeliveryRadiusMiles(dto.getDeliveryRadiusMiles());
        if (dto.getMinimumOrder() != null) existing.setMinimumOrder(dto.getMinimumOrder());
        if (dto.getAverageEtaMinutes() != null) existing.setAverageEtaMinutes(dto.getAverageEtaMinutes());

        Restaurant saved = restaurantRepository.save(existing);
        return restaurantMapper.toDto(saved);
    }

    // --- Restaurant Hours ---
    public List<RestaurantHoursDto> getHours(UUID restaurantId) {
        return restaurantMapper.toHoursDtoList(hoursRepository.findByRestaurantIdAndDeletedFalse(restaurantId));
    }

    @Transactional
    public RestaurantHoursDto saveHours(UUID restaurantId, RestaurantHoursDto dto) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        RestaurantHours hours = restaurantMapper.toEntity(dto);
        hours.setRestaurant(restaurant);
        RestaurantHours saved = hoursRepository.save(hours);
        return restaurantMapper.toDto(saved);
    }

    // --- Delivery Zones ---
    public List<DeliveryZoneDto> getDeliveryZones(UUID restaurantId) {
        return restaurantMapper.toZoneDtoList(deliveryZoneRepository.findByRestaurantIdAndDeletedFalse(restaurantId));
    }

    @Transactional
    public DeliveryZoneDto saveDeliveryZone(UUID restaurantId, DeliveryZoneDto dto) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        DeliveryZone zone = restaurantMapper.toEntity(dto);
        zone.setRestaurant(restaurant);
        DeliveryZone saved = deliveryZoneRepository.save(zone);
        return restaurantMapper.toDto(saved);
    }

    // --- Deals ---
    @Cacheable(value = "deals", key = "'active'")
    public List<DealDto> getActiveDeals() {
        return restaurantMapper.toDealDtoList(dealRepository.findByActiveTrueAndDeletedFalse());
    }

    @Cacheable(value = "deals", key = "#restaurantId")
    public List<DealDto> getRestaurantDeals(UUID restaurantId) {
        return restaurantMapper.toDealDtoList(dealRepository.findByRestaurantIdAndDeletedFalse(restaurantId));
    }

    @Transactional
    @CacheEvict(value = "deals", allEntries = true)
    public DealDto saveDeal(UUID restaurantId, DealDto dto) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        Deal deal = restaurantMapper.toEntity(dto);
        deal.setRestaurant(restaurant);
        Deal saved = dealRepository.save(deal);
        return restaurantMapper.toDto(saved);
    }

    public List<RestaurantDto> getAllRestaurants() {
        return restaurantMapper.toDtoList(restaurantRepository.findAll());
    }

    public List<RestaurantDto> getRestaurantsOwnedBy(UUID ownerId) {
        return restaurantMapper.toDtoList(restaurantRepository.findByOwnerIdAndDeletedFalse(ownerId));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "restaurants", allEntries = true),
        @CacheEvict(value = "restaurant_details", allEntries = true)
    })
    public RestaurantDto approveRestaurant(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", id));
        restaurant.setApproved(true);
        Restaurant saved = restaurantRepository.save(restaurant);
        return restaurantMapper.toDto(saved);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "restaurants", allEntries = true),
        @CacheEvict(value = "restaurant_details", allEntries = true)
    })
    public void deleteRestaurant(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", id));
        restaurant.setDeleted(true);
        restaurantRepository.save(restaurant);
    }

    @Transactional
    public void inviteStaff(UUID restaurantId, String email) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        
        com.mislice.domain.user.User user = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email)
                .orElseThrow(() -> new IllegalArgumentException("User with this email not found."));
                
        user.getRoles().add(com.mislice.domain.user.Role.RESTAURANT_STAFF);
        userRepository.save(user);
    }

    public List<java.util.Map<String, Object>> getStaff(UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        
        // As there's no explicit ManyToMany link yet, return owner as default.
        return List.of(java.util.Map.of(
            "id", restaurant.getOwner().getId(),
            "name", restaurant.getOwner().getFullName(),
            "email", restaurant.getOwner().getEmail(),
            "role", "Owner",
            "status", "Active",
            "joinedAt", restaurant.getOwner().getCreatedAt().toString()
        ));
    }
}
