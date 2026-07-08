package com.mislice.domain.menu;

import com.mislice.domain.menu.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface MenuMapper {

    @Mapping(target = "restaurant", ignore = true)
    Category toEntity(CategoryDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    CategoryDto toDto(Category entity);

    List<CategoryDto> toCategoryDtoList(List<Category> entities);

    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "category", ignore = true)
    MenuItem toEntity(MenuItemDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    @Mapping(source = "category.id", target = "categoryId")
    MenuItemDto toDto(MenuItem entity);

    List<MenuItemDto> toMenuItemDtoList(List<MenuItem> entities);

    @Mapping(target = "restaurant", ignore = true)
    PizzaSize toEntity(PizzaSizeDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    PizzaSizeDto toDto(PizzaSize entity);

    List<PizzaSizeDto> toPizzaSizeDtoList(List<PizzaSize> entities);

    @Mapping(target = "restaurant", ignore = true)
    CrustType toEntity(CrustTypeDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    CrustTypeDto toDto(CrustType entity);

    List<CrustTypeDto> toCrustTypeDtoList(List<CrustType> entities);

    @Mapping(target = "restaurant", ignore = true)
    Topping toEntity(ToppingDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    ToppingDto toDto(Topping entity);

    List<ToppingDto> toToppingDtoList(List<Topping> entities);
}
