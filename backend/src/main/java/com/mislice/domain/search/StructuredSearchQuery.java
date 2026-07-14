package com.mislice.domain.search;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class StructuredSearchQuery {
    private String originalQuery;
    private SortType sortType;
    private String category; // e.g. "Pepperoni", "Cheese"
    private String size; // e.g. "Small", "Medium", "Large"
    private BigDecimal maxPrice;
    private String crustType; // e.g. "Thin", "Deep Dish"
    private String dietary; // e.g. "Vegan", "Gluten Free"

    public enum SortType {
        CHEAPEST,
        FASTEST,
        RELEVANCE
    }
}
