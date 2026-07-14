package com.mislice.domain.mapping;

public interface AiTaxonomyClassifier {
    StandardTaxonomyResult classifyMenuItem(String itemName, String itemDescription);
}
