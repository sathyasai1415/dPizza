package com.mislice.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserRepository;
import com.mislice.domain.user.Role;
import com.mislice.domain.user.AccountStatus;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDemoAccounts() {
        log.info("Checking and seeding default demo accounts...");
        try {
            seedCustomerDemo();
            seedOwnerDemo();
            seedAdminDemo();
        } catch (Exception e) {
            log.error("Error occurred while seeding demo accounts: {}", e.getMessage(), e);
        }
    }

    private void seedCustomerDemo() {
        String email = "demo.customer@mislice.com";
        if (userRepository.findByEmailIgnoreCaseAndDeletedFalse(email).isPresent()) {
            log.info("Demo customer user already exists in local database.");
            return;
        }

        String uid = getOrCreateFirebaseUser(email, "Demo@1234", "Demo Customer", "demo_customer_uid");

        User customer = User.builder()
                .email(email)
                .uid(uid)
                .fullName("Demo Customer")
                .roles(Set.of(Role.CUSTOMER))
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .phone("555-019-2834")
                .vegetarian(false)
                .preferredCrust("Hand Tossed")
                .dietaryPrefs(new String[]{"None"})
                .meatPrefs(new String[]{"Pepperoni", "Ham"})
                .favoriteToppings(new String[]{"Mushrooms", "Onions"})
                .budgetRange("$$")
                .notificationsEnabled(true)
                .build();

        userRepository.save(customer);
        log.info("Successfully seeded demo customer with UID: {}", uid);
    }

    private void seedOwnerDemo() {
        String email = "demo.owner@mislice.com";
        if (userRepository.findByEmailIgnoreCaseAndDeletedFalse(email).isPresent()) {
            log.info("Demo owner user already exists in local database.");
            return;
        }

        String uid = getOrCreateFirebaseUser(email, "Demo@1234", "Demo Owner", "demo_owner_uid");

        User owner = User.builder()
                .email(email)
                .uid(uid)
                .fullName("Demo Store Owner")
                .roles(Set.of(Role.RESTAURANT_OWNER))
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .phone("555-019-8899")
                .notificationsEnabled(true)
                .build();

        owner = userRepository.save(owner);

        // Build a default Restaurant for this owner so they have data on their dashboard immediately
        Restaurant restaurant = Restaurant.builder()
                .owner(owner)
                .name("Detroit Moto Pizza")
                .slug("detroit-moto-pizza")
                .tagline("Authentic Motor City Deep Dish")
                .description("Seeded demo restaurant serving high-quality Detroit-style pizzas with premium ingredients.")
                .phone("313-555-0123")
                .addressLine("123 Woodard Ave")
                .city("Detroit")
                .state("MI")
                .postalCode("48201")
                .logoUrl("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400")
                .brandColor("#e80505")
                .ratingAvg(BigDecimal.valueOf(4.8))
                .ratingCount(24)
                .acceptingOrders(true)
                .approved(true)
                .applicationStatus("APPROVED")
                .setupComplete(true)
                .deliveryFee(BigDecimal.valueOf(2.99))
                .deliveryRadiusMiles(BigDecimal.valueOf(5.0))
                .minimumOrder(BigDecimal.valueOf(15.00))
                .averageEtaMinutes(25)
                .emoji("🍕")
                .category("LOCAL")
                .priceRange("$$")
                .neighborhood("Midtown")
                .website("https://detroitmotopizza.com")
                .trendScore(95)
                .featured(true)
                .newStore(true)
                .tags(new String[]{"Detroit Style", "Deep Dish", "Halal"})
                .build();

        restaurantRepository.save(restaurant);
        log.info("Successfully seeded demo owner and default restaurant (Detroit Moto Pizza).");
    }

    private void seedAdminDemo() {
        String email = "admin@mislice.com";
        // Check if admin user is already present in PostgreSQL
        var adminOpt = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email);
        
        // Ensure the Firebase account is created/linked
        String uid = getOrCreateFirebaseUser(email, "Demo@1234", "Platform Admin", "admin_uid");
        
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            if (admin.getUid() == null || !admin.getUid().equals(uid)) {
                admin.setUid(uid);
                userRepository.save(admin);
            }
            log.info("Linked existing admin user to Firebase UID: {}", uid);
        } else {
            User admin = User.builder()
                    .email(email)
                    .uid(uid)
                    .fullName("Platform Admin")
                    .roles(Set.of(Role.ADMIN))
                    .accountStatus(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .phone("555-019-0000")
                    .notificationsEnabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Successfully seeded admin user with UID: {}", uid);
        }
    }

    private String getOrCreateFirebaseUser(String email, String password, String displayName, String suggestedUid) {
        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            log.info("Found existing Firebase user for email: {} with UID: {}", email, userRecord.getUid());
            return userRecord.getUid();
        } catch (Exception e) {
            try {
                UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                        .setEmail(email)
                        .setPassword(password)
                        .setDisplayName(displayName)
                        .setUid(suggestedUid);
                UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
                log.info("Created new Firebase user for email: {} with UID: {}", email, userRecord.getUid());
                return userRecord.getUid();
            } catch (Exception ex) {
                try {
                    UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                            .setEmail(email)
                            .setPassword(password)
                            .setDisplayName(displayName);
                    UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
                    log.info("Created new Firebase user (auto-generated UID) for email: {} with UID: {}", email, userRecord.getUid());
                    return userRecord.getUid();
                } catch (Exception ex2) {
                    log.warn("Firebase Admin SDK call failed, falling back to mock UID for: {}", email);
                    return suggestedUid;
                }
            }
        }
    }
}
