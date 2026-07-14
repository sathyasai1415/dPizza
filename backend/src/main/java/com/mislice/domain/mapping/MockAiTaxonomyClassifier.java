package com.mislice.domain.mapping;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
public class MockAiTaxonomyClassifier implements AiTaxonomyClassifier {

    private static final Logger log = LoggerFactory.getLogger(MockAiTaxonomyClassifier.class);

    @Override
    public StandardTaxonomyResult classifyMenuItem(String itemName, String itemDescription) {
        log.info("Mock AI classifying item: {} - {}", itemName, itemDescription);
        
        String lowerName = (itemName + " " + (itemDescription != null ? itemDescription : "")).toLowerCase();
        String profile = "Cheese"; // default
        String size = "Large"; // default
        
        // Simple heuristics to simulate AI output
        if (lowerName.contains("meat") || lowerName.contains("carnivore")) {
            profile = "Meat Lovers";
        } else if (lowerName.contains("pep")) {
            profile = "Pepperoni";
        } else if (lowerName.contains("hawaiian") || lowerName.contains("pineapple")) {
            profile = "Hawaiian";
        } else if (lowerName.contains("margherita")) {
            profile = "Margherita";
        } else if (lowerName.contains("bbq")) {
            profile = "BBQ Chicken";
        }

        if (lowerName.contains("10") || lowerName.contains("small")) {
            size = "Small";
        } else if (lowerName.contains("12") || lowerName.contains("med")) {
            size = "Medium";
        } else if (lowerName.contains("16") || lowerName.contains("xl") || lowerName.contains("extra large")) {
            size = "Extra Large";
        }
        
        log.info("Mock AI returned Profile: {}, Size: {}", profile, size);
        return new StandardTaxonomyResult(profile, size);
    }
}
