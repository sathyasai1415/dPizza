package com.mislice.domain.cart;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.cart.dto.AddToCartRequest;
import com.mislice.domain.cart.dto.CartDto;
import com.mislice.domain.coupon.Coupon;
import com.mislice.domain.coupon.CouponRepository;
import com.mislice.domain.menu.MenuItem;
import com.mislice.domain.menu.MenuItemRepository;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final CouponRepository couponRepository;
    private final CartMapper cartMapper;

    public CartDto getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return cartMapper.toDto(cart);
    }

    public CartDto addToCart(UUID userId, AddToCartRequest req) {
        Cart cart = getOrCreateCart(userId);

        // If switching restaurants, clear existing items
        if (cart.getRestaurant() != null && !cart.getRestaurant().getId().equals(req.restaurantId())) {
            cart.getItems().clear();
            cart.setCoupon(null);
        }

        if (cart.getRestaurant() == null || !cart.getRestaurant().getId().equals(req.restaurantId())) {
            Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", req.restaurantId()));
            cart.setRestaurant(restaurant);
        }

        MenuItem menuItem = null;
        if (req.menuItemId() != null) {
            menuItem = menuItemRepository.findById(req.menuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", req.menuItemId()));
        }

        CartItem item = CartItem.builder()
            .cart(cart)
            .menuItem(menuItem)
            .itemName(req.itemName())
            .size(req.size())
            .crust(req.crust())
            .sauce(req.sauce())
            .quantity(req.quantity())
            .unitPrice(req.unitPrice())
            .notes(req.notes())
            .toppings(new ArrayList<>())
            .build();

        if (req.toppings() != null) {
            req.toppings().forEach(t -> item.getToppings().add(
                CartItemTopping.builder()
                    .toppingId(t.toppingId())
                    .toppingName(t.toppingName())
                    .price(t.price())
                    .build()
            ));
        }

        cart.getItems().add(item);
        Cart saved = cartRepository.save(cart);
        return cartMapper.toDto(saved);
    }

    public CartDto updateCartItem(UUID userId, UUID itemId, int quantity, String notes) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("CartItem", itemId));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(quantity);
            item.setNotes(notes);
        }

        if (cart.getItems().isEmpty()) {
            cart.setRestaurant(null);
            cart.setCoupon(null);
        }

        Cart saved = cartRepository.save(cart);
        return cartMapper.toDto(saved);
    }

    public CartDto removeFromCart(UUID userId, UUID itemId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(i -> i.getId().equals(itemId));

        if (cart.getItems().isEmpty()) {
            cart.setRestaurant(null);
            cart.setCoupon(null);
        }

        Cart saved = cartRepository.save(cart);
        return cartMapper.toDto(saved);
    }

    public CartDto applyCoupon(UUID userId, String code) {
        Cart cart = getOrCreateCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot apply coupon to an empty cart");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", code));

        if (!coupon.isActive()) {
            throw new IllegalStateException("Coupon is inactive");
        }

        // Validate restaurant match
        if (coupon.getRestaurant() != null && !coupon.getRestaurant().getId().equals(cart.getRestaurant().getId())) {
            throw new IllegalStateException("Coupon is not valid for this restaurant");
        }

        cart.setCoupon(coupon);
        Cart saved = cartRepository.save(cart);
        return cartMapper.toDto(saved);
    }

    public CartDto clearCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cart.setRestaurant(null);
        cart.setCoupon(null);
        Cart saved = cartRepository.save(cart);
        return cartMapper.toDto(saved);
    }

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
            Cart cart = Cart.builder().user(user).build();
            return cartRepository.save(cart);
        });
    }
}
