package com.mislice.domain.review;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.order.Order;
import com.mislice.domain.order.OrderRepository;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.restaurant.RestaurantRepository;
import com.mislice.domain.review.dto.ReviewDto;
import com.mislice.domain.review.dto.SubmitReviewRequest;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    public List<ReviewDto> getReviewsForRestaurant(UUID restaurantId) {
        return reviewRepository.findByRestaurantIdAndModerationStatus(restaurantId, "APPROVED").stream()
            .map(reviewMapper::toDto)
            .toList();
    }

    public ReviewDto submitReview(UUID userId, SubmitReviewRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", req.restaurantId()));

        Order order = null;
        if (req.orderId() != null) {
            order = orderRepository.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", req.orderId()));
        }

        Review review = Review.builder()
            .user(user)
            .restaurant(restaurant)
            .order(order)
            .rating(req.rating())
            .comment(req.comment())
            .moderationStatus("APPROVED") // Auto-approve for demo
            .build();

        Review saved = reviewRepository.save(review);

        // Recalculate restaurant ratings
        recalculateRestaurantRating(restaurant);

        return reviewMapper.toDto(saved);
    }

    private void recalculateRestaurantRating(Restaurant restaurant) {
        List<Review> approvedReviews = reviewRepository.findByRestaurantIdAndModerationStatus(restaurant.getId(), "APPROVED");
        
        int count = approvedReviews.size();
        double sum = approvedReviews.stream()
            .mapToInt(Review::getRating)
            .sum();

        double avg = count > 0 ? sum / count : 0.0;

        restaurant.setRatingAvg(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
        restaurant.setRatingCount(count);
        restaurantRepository.save(restaurant);
    }
}
