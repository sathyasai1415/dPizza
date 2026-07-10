package com.mislice.domain.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.mislice.common.exception.ApiException;
import com.mislice.common.exception.DuplicateResourceException;
import com.mislice.domain.auth.dto.AuthResponse;
import com.mislice.domain.auth.dto.LoginRequest;
import com.mislice.domain.auth.dto.RegisterRequest;
import com.mislice.domain.user.AccountStatus;
import com.mislice.domain.user.Role;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserMapper;
import com.mislice.domain.user.UserRepository;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RestaurantRepository restaurantRepository;
    private final com.mislice.security.JwtService jwtService;

    @Transactional(readOnly = true)
    public String resolveOwnerEmailByStoreId(String storeId) {
        Restaurant restaurant = null;
        try {
            UUID uuid = UUID.fromString(storeId);
            restaurant = restaurantRepository.findById(uuid)
                    .filter(r -> !r.isDeleted())
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            // Not a UUID, fallback to slug
        }
        if (restaurant == null) {
            restaurant = restaurantRepository.findBySlugAndDeletedFalse(storeId).orElse(null);
        }
        if (restaurant == null || restaurant.getOwner() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "STORE_NOT_FOUND", "No active restaurant found for ID: " + storeId);
        }
        return restaurant.getOwner().getEmail();
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        var existingUserOpt = userRepository.findByEmailIgnoreCaseAndDeletedFalse(req.email());
        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            // Auto-heal/link UID if the pre-seeded account does not have a real Firebase UID yet
            if (user.getUid() == null || user.getUid().startsWith("mock_uid_")) {
                user.setUid(req.uid());
                userRepository.save(user);
                return new AuthResponse(
                        "",
                        "",
                        "Bearer",
                        3600,
                        userMapper.toDto(user)
                );
            } else {
                throw new DuplicateResourceException("Email already registered: " + req.email());
            }
        }

        if (userRepository.findByUidAndDeletedFalse(req.uid()).isPresent()) {
            throw new DuplicateResourceException("User UID already exists: " + req.uid());
        }

        Role role = resolveSelfAssignableRole(req.requestedRole());

        User user = User.builder()
                .email(req.email().toLowerCase())
                .uid(req.uid())
                .fullName(req.fullName())
                .phone(req.phone())
                .roles(Set.of(role))
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        user = userRepository.save(user);

        if (role == Role.RESTAURANT_OWNER) {
            String restaurantName = req.restaurantName() != null ? req.restaurantName() : "My Pizza Shop";
            String slug = generateSlug(restaurantName);
            Restaurant restaurant = Restaurant.builder()
                    .owner(user)
                    .name(restaurantName)
                    .slug(slug)
                    .addressLine(req.addressLine() != null ? req.addressLine() : "123 Main St")
                    .city(req.city() != null ? req.city() : "Detroit")
                    .state(req.state() != null ? req.state() : "MI")
                    .postalCode(req.postalCode() != null ? req.postalCode() : "48201")
                    .description(req.description() != null ? req.description() : "Local pizza shop.")
                    .website(req.website())
                    .ratingAvg(BigDecimal.ZERO)
                    .ratingCount(0)
                    .acceptingOrders(true)
                    .approved(true)
                    .applicationStatus("APPROVED")
                    .setupComplete(true)
                    .build();
            restaurantRepository.save(restaurant);
        }

        return new AuthResponse(
                "",
                "",
                "Bearer",
                3600,
                userMapper.toDto(user)
        );
    }

    private String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "restaurant-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
        String slug = baseSlug;
        int count = 1;
        while (restaurantRepository.findBySlugAndDeletedFalse(slug).isPresent()) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String tempUid;
        String tempEmail;
        String tempName;
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(req.idToken());
            tempUid = decodedToken.getUid();
            tempEmail = decodedToken.getEmail();
            tempName = decodedToken.getName();
            if (tempName == null || tempName.trim().isEmpty()) {
                tempName = tempEmail != null ? tempEmail.split("@")[0] : "User";
            }
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Firebase ID token verification failed: " + e.getMessage());
        }

        final String uid = tempUid;
        final String email = tempEmail != null ? tempEmail.toLowerCase() : req.email().toLowerCase();
        final String name = tempName;

        // Retrieve existing user
        var userOpt = userRepository.findByUidAndDeletedFalse(uid);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email);
            if (userOpt.isPresent()) {
                // Link pre-seeded email account
                User existing = userOpt.get();
                existing.setUid(uid);
                userRepository.save(existing);
            }
        }

        if (userOpt.isEmpty()) {
            // New user requires role selection (Google flow first time)
            return new AuthResponse(
                    req.idToken(),
                    "",
                    "Bearer",
                    3600,
                    null,
                    true
            );
        }

        User user = userOpt.get();

        return new AuthResponse(
                req.idToken(),
                "",
                "Bearer",
                3600,
                userMapper.toDto(user),
                false
        );
    }
    @Transactional
    public AuthResponse demoLogin(com.mislice.domain.auth.dto.DemoLoginRequest req) {
        String email;
        String name;
        Role role;

        if ("RESTAURANT_OWNER".equals(req.role())) {
            email = "demo.owner@mislice.com";
            name = "Demo Store Owner";
            role = Role.RESTAURANT_OWNER;
        } else if ("ADMIN".equals(req.role())) {
            email = "admin@mislice.com";
            name = "Platform Admin";
            role = Role.ADMIN;
        } else {
            email = "demo.customer@mislice.com";
            name = "Demo Customer";
            role = Role.CUSTOMER;
        }

        // Auto-provision or fetch demo account
        User user = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email)
                .orElseGet(() -> {
                    String uid = "demo_uid_" + java.util.UUID.randomUUID().toString();
                    User newUser = User.builder()
                            .email(email)
                            .uid(uid)
                            .fullName(name)
                            .roles(Set.of(role))
                            .accountStatus(AccountStatus.ACTIVE)
                            .emailVerified(true)
                            .build();
                    return userRepository.save(newUser);
                });

        // Ensure user has a UID
        if (user.getUid() == null || user.getUid().isEmpty()) {
            user.setUid("demo_uid_" + java.util.UUID.randomUUID().toString());
            user = userRepository.save(user);
        }

        String customToken = jwtService.generateToken(user.getUid());

        return new AuthResponse(
                customToken,
                "",
                "Bearer",
                3600,
                userMapper.toDto(user)
        );
    }


    public void logout(UUID userId) {
        // Stateless JWT session; logout is handled client-side.
    }

    public void logoutByEmail(String email) {
        // Stateless JWT session; logout is handled client-side.
    }

    private Role resolveSelfAssignableRole(Role requested) {
        if (requested == null || requested == Role.ADMIN) {
            return Role.CUSTOMER; // ADMIN is never self-assignable
        }
        return requested;
    }
}
