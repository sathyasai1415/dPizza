package com.mislice.domain.compare;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChainReviewRepository extends JpaRepository<ChainReview, UUID> {
    List<ChainReview> findByChainId(UUID chainId);
}
