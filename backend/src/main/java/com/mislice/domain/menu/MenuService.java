package com.mislice.domain.menu;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.menu.dto.*;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mislice.common.exception.ApiException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {

    private final RestaurantRepository restaurantRepository;
    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final PizzaSizeRepository pizzaSizeRepository;
    private final CrustTypeRepository crustTypeRepository;
    private final ToppingRepository toppingRepository;
    private final MenuMapper menuMapper;

    public List<CategoryDto> getCategories(UUID restaurantId) {
        return menuMapper.toCategoryDtoList(
                categoryRepository.findByRestaurantIdAndDeletedFalseOrderBySortOrderAsc(restaurantId));
    }

    public List<MenuItemDto> getMenuItems(UUID restaurantId) {
        return menuMapper.toMenuItemDtoList(
                menuItemRepository.findByRestaurantIdAndDeletedFalse(restaurantId));
    }

    public PizzaOptionsResponse getPizzaOptions(UUID restaurantId) {
        List<PizzaSizeDto> sizes = menuMapper.toPizzaSizeDtoList(
                pizzaSizeRepository.findByRestaurantIdAndDeletedFalseOrderBySortOrderAsc(restaurantId));
        List<CrustTypeDto> crusts = menuMapper.toCrustTypeDtoList(
                crustTypeRepository.findByRestaurantIdAndDeletedFalse(restaurantId));
        List<ToppingDto> toppings = menuMapper.toToppingDtoList(
                toppingRepository.findByRestaurantIdAndDeletedFalse(restaurantId));

        return PizzaOptionsResponse.builder()
                .sizes(sizes)
                .crusts(crusts)
                .toppings(toppings)
                .build();
    }

    @Transactional
    public MenuItemDto saveMenuItem(UUID restaurantId, MenuItemDto dto) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", restaurantId));
        
        MenuItem item = menuMapper.toEntity(dto);
        item.setRestaurant(restaurant);
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", dto.getCategoryId()));
            item.setCategory(category);
        }
        
        MenuItem saved = menuItemRepository.save(item);
        return menuMapper.toDto(saved);
    }

    @Transactional
    public void deleteMenuItem(UUID itemId) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemId));
        item.setDeleted(true);
        menuItemRepository.save(item);
    }

    @Transactional
    public void updateAvailability(UUID itemId, boolean available) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemId));
        item.setAvailable(available);
        menuItemRepository.save(item);
    }

    @Transactional
    public MenuItemDto updatePrice(UUID restaurantId, UUID itemId, BigDecimal newPrice) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemId));

        if (!item.getRestaurant().getId().equals(restaurantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "OWNERSHIP_VIOLATION",
                "You can only update prices for menu items in your own restaurant");
        }

        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PRICE",
                "Price must be a valid positive number");
        }

        item.setBasePrice(newPrice);
        MenuItem saved = menuItemRepository.save(item);
        return menuMapper.toDto(saved);
    }
}
