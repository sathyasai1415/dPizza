package com.mislice.domain.menu.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PizzaOptionsResponse {
    private List<PizzaSizeDto> sizes;
    private List<CrustTypeDto> crusts;
    private List<ToppingDto> toppings;
}
