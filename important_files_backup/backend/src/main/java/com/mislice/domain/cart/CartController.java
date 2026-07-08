package com.mislice.domain.cart;

import com.mislice.domain.cart.dto.AddToCartRequest;
import com.mislice.domain.cart.dto.CartDto;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/carts/me")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDto> getCart() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addToCart(@RequestBody AddToCartRequest req) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.addToCart(userId, req));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartDto> updateCartItem(
            @PathVariable UUID itemId,
            @RequestParam int quantity,
            @RequestParam(required = false) String notes) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.updateCartItem(userId, itemId, quantity, notes));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartDto> removeFromCart(@PathVariable UUID itemId) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.removeFromCart(userId, itemId));
    }

    @PostMapping("/coupon")
    public ResponseEntity<CartDto> applyCoupon(@RequestParam String code) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.applyCoupon(userId, code));
    }

    @DeleteMapping
    public ResponseEntity<CartDto> clearCart() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(cartService.clearCart(userId));
    }
}
