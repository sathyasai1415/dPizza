package com.mislice.domain.compare.dto;

import java.util.List;

public record ComparePizzaConfig(
    String size,
    String crust,
    String sauce,
    List<String> cheese,
    List<String> meats,
    List<String> veggies,
    List<String> extras,
    int quantity
) {}
