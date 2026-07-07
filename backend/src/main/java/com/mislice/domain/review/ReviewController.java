package com.mislice.domain.review;

import com.mislice.domain.review.dto.ReviewDto;
import com.mislice.domain.review.dto.SubmitReviewRequest;
import com.mislice.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<List<ReviewDto>> getRestaurantReviews(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(reviewService.getReviewsForRestaurant(restaurantId));
    }

    @PostMapping
    public ResponseEntity<ReviewDto> submitReview(@RequestBody SubmitReviewRequest req) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(reviewService.submitReview(userId, req));
    }
}
