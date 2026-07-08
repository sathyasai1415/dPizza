package com.mislice.domain.compare;

import com.mislice.domain.compare.dto.ChainDto;
import com.mislice.domain.compare.dto.ComparePizzaConfig;
import com.mislice.domain.compare.dto.QuoteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/compare")
@RequiredArgsConstructor
public class ChainCompareController {

    private final ChainCompareService chainCompareService;
    private final ChainRepository chainRepository;
    private final ChainMapper chainMapper;

    @PostMapping
    public ResponseEntity<List<QuoteDto>> comparePizzas(
            @RequestBody ComparePizzaConfig config,
            @RequestParam(defaultValue = "delivery") String deliveryType) {
        return ResponseEntity.ok(chainCompareService.calculateQuotes(config, deliveryType));
    }

    @GetMapping("/chains")
    public ResponseEntity<List<ChainDto>> getChains() {
        List<ChainDto> dtos = chainRepository.findAllByOrderBySortOrderAsc().stream()
            .map(chainMapper::toDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }
}
