package com.mislice.domain.mapping;

import com.mislice.domain.menu.*;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.ai.openai.api-key=test-key")
@ActiveProfiles("test")
@Transactional
class TaxonomyMappingJobIntegrationTest {

    @Autowired
    private TaxonomyMappingJob taxonomyMappingJob;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private StandardPizzaProfileRepository profileRepository;

    @Autowired
    private StandardPizzaSizeRepository sizeRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @BeforeEach
    void setUp() {
        // Ensure there is at least one restaurant
        Restaurant restaurant = new Restaurant();
        restaurant.setName("Test Pizzeria");
        restaurant.setSlug("test-pizzeria");
        restaurant.setPhone("555-0100");
        restaurant = restaurantRepository.save(restaurant);

        // Ensure there are standard profiles
        if (profileRepository.findByCategoryIgnoreCase("Pepperoni").isEmpty()) {
            StandardPizzaProfile pepperoni = new StandardPizzaProfile();
            pepperoni.setCategory("Pepperoni");
            profileRepository.save(pepperoni);
        }

        if (profileRepository.findByCategoryIgnoreCase("Meat Lovers").isEmpty()) {
            StandardPizzaProfile meat = new StandardPizzaProfile();
            meat.setCategory("Meat Lovers");
            profileRepository.save(meat);
        }

        if (sizeRepository.findByCategoryIgnoreCase("Large").isEmpty()) {
            StandardPizzaSize lg = new StandardPizzaSize();
            lg.setCategory("Large");
            lg.setMeasurementInches(14);
            sizeRepository.save(lg);
        }

        if (sizeRepository.findByCategoryIgnoreCase("Small").isEmpty()) {
            StandardPizzaSize sm = new StandardPizzaSize();
            sm.setCategory("Small");
            sm.setMeasurementInches(10);
            sizeRepository.save(sm);
        }

        // Create some unmapped pizzas
        MenuItem pizza1 = new MenuItem();
        pizza1.setRestaurant(restaurant);
        pizza1.setName("The Carnivore 14-inch");
        pizza1.setDescription("Loaded with pepperoni, sausage, ham, and bacon.");
        pizza1.setBasePrice(new BigDecimal("19.99"));
        pizza1.setItemType("PIZZA");
        menuItemRepository.save(pizza1);

        MenuItem pizza2 = new MenuItem();
        pizza2.setRestaurant(restaurant);
        pizza2.setName("Little Pep");
        pizza2.setDescription("A personal 10-inch pizza with extra pepperoni.");
        pizza2.setBasePrice(new BigDecimal("9.99"));
        pizza2.setItemType("PIZZA");
        menuItemRepository.save(pizza2);
    }

    @Test
    void testProcessUnmappedItems() {
        // Find unmapped pizzas before job
        List<MenuItem> unmappedBefore = menuItemRepository.findUnmappedPizzas(org.springframework.data.domain.PageRequest.of(0, 10));
        assertTrue(unmappedBefore.size() >= 2, "Should have at least 2 unmapped pizzas");

        // Run job
        taxonomyMappingJob.processUnmappedItems();

        // Check unmapped pizzas after job
        List<MenuItem> unmappedAfter = menuItemRepository.findUnmappedPizzas(org.springframework.data.domain.PageRequest.of(0, 10));
        
        // Find the pizzas we created and verify they got mapped
        boolean foundCarnivore = false;
        boolean foundLittlePep = false;
        
        for (MenuItem item : menuItemRepository.findAll()) {
            if ("The Carnivore 14-inch".equals(item.getName())) {
                foundCarnivore = true;
                assertNotNull(item.getStandardProfile(), "Carnivore should have a profile");
                assertEquals("Meat Lovers", item.getStandardProfile().getCategory());
                
                assertNotNull(item.getStandardSize(), "Carnivore should have a size");
                assertEquals("Large", item.getStandardSize().getCategory()); // 14-inch should map to Large (wait, mock logic maps 16=Extra Large, 12=Medium, 10=Small, default=Large)
            } else if ("Little Pep".equals(item.getName())) {
                foundLittlePep = true;
                assertNotNull(item.getStandardProfile(), "Little Pep should have a profile");
                assertEquals("Pepperoni", item.getStandardProfile().getCategory());
                
                assertNotNull(item.getStandardSize(), "Little Pep should have a size");
                assertEquals("Small", item.getStandardSize().getCategory());
            }
        }
        
        assertTrue(foundCarnivore, "Carnivore pizza not found after job");
        assertTrue(foundLittlePep, "Little Pep pizza not found after job");
    }
}
