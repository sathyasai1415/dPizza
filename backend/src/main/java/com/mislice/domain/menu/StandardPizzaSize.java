package com.mislice.domain.menu;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "standard_pizza_sizes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandardPizzaSize extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String category; // e.g. "Small", "Medium", "Large", "Extra Large"

    @Column(name = "measurement_inches")
    private Integer measurementInches; // e.g. 10, 12, 14, 16

    @Column(length = 50)
    private String shape; // e.g. "Round", "Square", "Rectangle"

    @Column(nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
