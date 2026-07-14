package com.mislice.domain.restaurant;

import com.mislice.domain.restaurant.dto.DealDto;
import com.mislice.domain.restaurant.dto.DeliveryZoneDto;
import com.mislice.domain.restaurant.dto.RestaurantDto;
import com.mislice.domain.restaurant.dto.RestaurantHoursDto;
import com.mislice.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurants Catalog", description = "Browse approved restaurants, hours, delivery zones, and deals")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @Operation(summary = "Get all approved restaurants, optionally filtered by city")
    @GetMapping
    public ResponseEntity<List<RestaurantDto>> getRestaurants(@RequestParam(value = "city", required = false) String city) {
        return ResponseEntity.ok(restaurantService.getApprovedRestaurants(city));
    }

    @Operation(summary = "Get a list of all cities where restaurants are registered")
    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(restaurantService.getApprovedCities());
    }

    @Operation(summary = "Get restaurant details by its unique URL slug")
    @GetMapping("/slug/{slug}")
    public ResponseEntity<RestaurantDto> getRestaurantBySlug(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(restaurantService.getRestaurantBySlug(slug));
    }

    @Operation(summary = "Get restaurants owned by the currently authenticated user")
    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN')")
    public ResponseEntity<List<RestaurantDto>> getMyRestaurants() {
        return ResponseEntity.ok(restaurantService.getRestaurantsOwnedBy(SecurityUtils.currentUserId()));
    }

    @Operation(summary = "Get restaurant details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDto> getRestaurantById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(id));
    }

    @Operation(summary = "Submit a new restaurant partnership application")
    @PostMapping
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<RestaurantDto> apply(@Valid @RequestBody RestaurantDto dto) {
        UUID ownerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(restaurantService.applyForRestaurant(dto, ownerId));
    }

    @Operation(summary = "Update restaurant profile details")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<RestaurantDto> update(@PathVariable("id") UUID id, @Valid @RequestBody RestaurantDto dto) {
        return ResponseEntity.ok(restaurantService.updateRestaurant(id, dto));
    }

    @Operation(summary = "Get open/close hours for a restaurant")
    @GetMapping("/{id}/hours")
    public ResponseEntity<List<RestaurantHoursDto>> getHours(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.getHours(id));
    }

    @Operation(summary = "Save open/close hours for a restaurant")
    @PostMapping("/{id}/hours")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<RestaurantHoursDto> saveHours(@PathVariable("id") UUID id, @Valid @RequestBody RestaurantHoursDto dto) {
        return ResponseEntity.ok(restaurantService.saveHours(id, dto));
    }

    @Operation(summary = "Get delivery zones for a restaurant")
    @GetMapping("/{id}/zones")
    public ResponseEntity<List<DeliveryZoneDto>> getDeliveryZones(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.getDeliveryZones(id));
    }

    @Operation(summary = "Save a delivery zone for a restaurant")
    @PostMapping("/{id}/zones")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<DeliveryZoneDto> saveDeliveryZone(@PathVariable("id") UUID id, @Valid @RequestBody DeliveryZoneDto dto) {
        return ResponseEntity.ok(restaurantService.saveDeliveryZone(id, dto));
    }

    @Operation(summary = "Get all active marketing deals platform-wide")
    @GetMapping("/deals")
    public ResponseEntity<List<DealDto>> getDeals() {
        return ResponseEntity.ok(restaurantService.getActiveDeals());
    }

    @Operation(summary = "Get deals associated with a single restaurant")
    @GetMapping("/{id}/deals")
    public ResponseEntity<List<DealDto>> getRestaurantDeals(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.getRestaurantDeals(id));
    }

    @Operation(summary = "Add a deal to a restaurant")
    @PostMapping("/{id}/deals")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<DealDto> saveDeal(@PathVariable("id") UUID id, @Valid @RequestBody DealDto dto) {
        return ResponseEntity.ok(restaurantService.saveDeal(id, dto));
    }

    @Operation(summary = "Get all restaurants (approved and pending) for platform admin")
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RestaurantDto>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantService.getAllRestaurants());
    }

    @Operation(summary = "Approve restaurant partnership application")
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantDto> approveRestaurant(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.approveRestaurant(id));
    }

    @Operation(summary = "Delete or reject a restaurant partnership")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable("id") UUID id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }
    @Operation(summary = "Invite staff to restaurant")
    @PostMapping("/{id}/staff/invite")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<Void> inviteStaff(@PathVariable("id") UUID id, @RequestBody java.util.Map<String, String> request) {
        restaurantService.inviteStaff(id, request.get("email"));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get list of staff for a restaurant")
    @GetMapping("/{id}/staff")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF', 'ADMIN')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getStaff(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(restaurantService.getStaff(id));
    }
}
