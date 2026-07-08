package com.mislice.domain.user;

import com.mislice.domain.user.dto.AddressDto;
import com.mislice.domain.user.dto.UserDto;
import com.mislice.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
@Tag(name = "Customer Profile & Addresses", description = "Endpoints for managing customer profile settings and addresses")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get the authenticated user's profile details")
    @GetMapping
    public ResponseEntity<UserDto> getProfile() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @Operation(summary = "Partially update user profile settings and preferences")
    @PatchMapping
    public ResponseEntity<UserDto> updateProfile(@Valid @RequestBody UserDto dto) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.updateProfile(userId, dto));
    }

    @Operation(summary = "Get list of saved delivery addresses")
    @GetMapping("/addresses")
    public ResponseEntity<List<AddressDto>> getAddresses() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.getAddresses(userId));
    }

    @Operation(summary = "Add a new saved delivery address")
    @PostMapping("/addresses")
    public ResponseEntity<AddressDto> addAddress(@Valid @RequestBody AddressDto dto) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.addAddress(userId, dto));
    }

    @Operation(summary = "Update an existing saved delivery address")
    @PutMapping("/addresses/{id}")
    public ResponseEntity<AddressDto> updateAddress(
            @PathVariable("id") UUID addressId,
            @Valid @RequestBody AddressDto dto) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.updateAddress(userId, addressId, dto));
    }

    @Operation(summary = "Delete a saved delivery address")
    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable("id") UUID addressId) {
        UUID userId = SecurityUtils.currentUserId();
        userService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }
}
