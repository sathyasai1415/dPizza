package com.mislice.domain.menu;

import com.mislice.domain.menu.dto.CategoryDto;
import com.mislice.domain.menu.dto.MenuItemDto;
import com.mislice.domain.menu.dto.PizzaOptionsResponse;
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

import com.mislice.domain.menu.dto.OcrMenuItemSuggestion;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}")
@RequiredArgsConstructor
@Tag(name = "Menu & Options", description = "Query store menu items, categories, and custom builder option catalogs")
public class MenuController {

    private final MenuService menuService;
    private final VisionService visionService;

    @Operation(summary = "Get menu categories for a restaurant")
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories(@PathVariable("restaurantId") UUID restaurantId) {
        return ResponseEntity.ok(menuService.getCategories(restaurantId));
    }

    @Operation(summary = "Get menu items for a restaurant")
    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemDto>> getMenuItems(@PathVariable("restaurantId") UUID restaurantId) {
        return ResponseEntity.ok(menuService.getMenuItems(restaurantId));
    }

    @Operation(summary = "Get sizes, crusts, and toppings for the pizza customizer")
    @GetMapping("/pizza-options")
    public ResponseEntity<PizzaOptionsResponse> getPizzaOptions(@PathVariable("restaurantId") UUID restaurantId) {
        return ResponseEntity.ok(menuService.getPizzaOptions(restaurantId));
    }

    @Operation(summary = "Add or update a menu item")
    @PostMapping("/menu-items")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<MenuItemDto> saveMenuItem(
            @PathVariable("restaurantId") UUID restaurantId,
            @Valid @RequestBody MenuItemDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.saveMenuItem(restaurantId, dto));
    }

    @Operation(summary = "Delete a menu item")
    @DeleteMapping("/menu-items/{itemId}")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable("restaurantId") UUID restaurantId,
            @PathVariable("itemId") UUID itemId) {
        menuService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle menu item availability")
    @PatchMapping("/menu-items/{itemId}/availability")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<Void> updateAvailability(
            @PathVariable("restaurantId") UUID restaurantId,
            @PathVariable("itemId") UUID itemId,
            @RequestParam("available") boolean available) {
        menuService.updateAvailability(itemId, available);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Update menu item base price")
    @PatchMapping("/menu-items/{itemId}/price")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<MenuItemDto> updatePrice(
            @PathVariable("restaurantId") UUID restaurantId,
            @PathVariable("itemId") UUID itemId,
            @RequestParam("price") java.math.BigDecimal newPrice) {
        return ResponseEntity.ok(menuService.updatePrice(restaurantId, itemId, newPrice));
    }

    @Operation(summary = "Process menu image via Google Cloud Vision OCR and return item suggestions")
    @PostMapping(value = "/menu/import-ocr", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'ADMIN')")
    public ResponseEntity<List<OcrMenuItemSuggestion>> importMenuOcr(
            @PathVariable("restaurantId") UUID restaurantId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(visionService.extractMenuItemsFromMenuImage(file));
    }
}
