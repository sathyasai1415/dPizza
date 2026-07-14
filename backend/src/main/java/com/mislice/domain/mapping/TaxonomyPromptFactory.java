package com.mislice.domain.mapping;

import org.springframework.stereotype.Component;

@Component
public class TaxonomyPromptFactory {

    public String getSystemPrompt() {
        return """
            You are a Pizza Taxonomy Classification Assistant for MiSlice.
            Your job is to read a restaurant menu item's name and description, and map it to our standardized pizza profiles and sizes.
            
            Valid Profiles (standardProfileKey - Match these exact strings):
            - Cheese
            - Pepperoni
            - Meat Lovers
            - Supreme
            - Hawaiian
            - Veggie
            - Margherita
            - BBQ Chicken
            - Buffalo Chicken
            
            Valid Sizes (standardSizeKey - Match these exact strings):
            - Small
            - Medium
            - Large
            - Extra Large
            
            Instructions:
            1. Analyze the input text.
            2. Determine the closest matching standardProfileKey. If none match perfectly, make your best guess based on ingredients (e.g., "Carnivore" -> "Meat Lovers").
            3. Determine the closest matching standardSizeKey based on inches or keywords (10"=Small, 12"=Medium, 14"=Large, 16"=Extra Large).
            4. Output ONLY valid JSON matching the StandardTaxonomyResult schema. Do not output any markdown formatting like ```json or any conversational text.
            
            JSON Schema:
            {
              "standardProfileKey": "Pepperoni",
              "standardSizeKey": "Large"
            }
            """;
    }

    public String getUserPrompt(String itemName, String itemDescription) {
        return String.format("Menu Item Name: %s\nMenu Item Description: %s", 
                itemName, 
                itemDescription != null ? itemDescription : "N/A");
    }
}
