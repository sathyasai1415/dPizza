package com.mislice.domain.mapping;

import com.mislice.domain.menu.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaxonomyMappingJob {

    private static final Logger log = LoggerFactory.getLogger(TaxonomyMappingJob.class);

    private final MenuItemRepository menuItemRepository;
    private final StandardPizzaProfileRepository profileRepository;
    private final StandardPizzaSizeRepository sizeRepository;
    private final AiTaxonomyClassifier aiClassifier;

    public TaxonomyMappingJob(MenuItemRepository menuItemRepository,
                              StandardPizzaProfileRepository profileRepository,
                              StandardPizzaSizeRepository sizeRepository,
                              AiTaxonomyClassifier aiClassifier) {
        this.menuItemRepository = menuItemRepository;
        this.profileRepository = profileRepository;
        this.sizeRepository = sizeRepository;
        this.aiClassifier = aiClassifier;
    }

    // Run every 5 minutes
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void processUnmappedItems() {
        log.info("Starting AI Taxonomy Mapping Job...");

        // Fetch up to 50 unmapped pizzas at a time
        List<MenuItem> unmappedItems = menuItemRepository.findUnmappedPizzas(PageRequest.of(0, 50));
        
        if (unmappedItems.isEmpty()) {
            log.info("No unmapped pizza items found.");
            return;
        }

        log.info("Found {} unmapped pizza items. Processing...", unmappedItems.size());

        for (MenuItem item : unmappedItems) {
            try {
                StandardTaxonomyResult result = aiClassifier.classifyMenuItem(item.getName(), item.getDescription());
                
                if (result != null) {
                    if (result.getStandardProfileKey() != null) {
                        profileRepository.findByCategoryIgnoreCase(result.getStandardProfileKey())
                                .ifPresent(item::setStandardProfile);
                    }
                    
                    if (result.getStandardSizeKey() != null) {
                        sizeRepository.findByCategoryIgnoreCase(result.getStandardSizeKey())
                                .ifPresent(item::setStandardSize);
                    }
                    
                    log.info("Mapped item '{}' to Profile: {}, Size: {}", 
                            item.getName(), 
                            item.getStandardProfile() != null ? item.getStandardProfile().getCategory() : "NULL",
                            item.getStandardSize() != null ? item.getStandardSize().getCategory() : "NULL");
                }
            } catch (Exception e) {
                log.error("Failed to map item: {}", item.getName(), e);
            }
        }
        
        // Save all updated items
        menuItemRepository.saveAll(unmappedItems);
        log.info("Finished AI Taxonomy Mapping Job.");
    }
}
