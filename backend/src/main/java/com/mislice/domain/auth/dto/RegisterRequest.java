package com.mislice.domain.auth.dto;

import com.mislice.domain.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank String uid,
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 30) String phone,
        Role requestedRole,
        String restaurantName,
        String addressLine,
        String city,
        String state,
        String postalCode,
        String description,
        String website
) {
    public RegisterRequest(String email, String uid, String fullName, String phone, Role requestedRole) {
        this(email, uid, fullName, phone, requestedRole, null, null, null, null, null, null, null);
    }
}
