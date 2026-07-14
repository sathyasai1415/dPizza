package com.mislice.domain.menu;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/menu/profiles")
@RequiredArgsConstructor
public class StandardMenuController {

    private final StandardPizzaProfileRepository repository;

    @GetMapping
    public ResponseEntity<List<StandardPizzaProfile>> getProfiles() {
        return ResponseEntity.ok(repository.findAll());
    }
}
