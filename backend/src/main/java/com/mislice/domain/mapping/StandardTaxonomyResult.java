package com.mislice.domain.mapping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardTaxonomyResult {
    private String standardProfileKey; // e.g., 'pepperoni', 'meat_lovers'
    private String standardSizeKey; // e.g., '14"', '10"'
}
