package com.pipai.repository;

import com.pipai.domain.RiskChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RiskRepository extends JpaRepository<RiskChecklistItem, UUID> {
    List<RiskChecklistItem> findByUserIdOrderByLevelAscCreatedAtDesc(UUID userId);
    List<RiskChecklistItem> findByUserIdAndResolved(UUID userId, boolean resolved);
    boolean existsByUserIdAndRelatedLaw(UUID userId, String relatedLaw);
    List<RiskChecklistItem> findByUserIdAndSourceTypeAndDiagnosisCodeInOrderByLevelAscCreatedAtDesc(
            UUID userId, RiskChecklistItem.SourceType sourceType, List<String> diagnosisCodes);
    List<RiskChecklistItem> findByUserIdAndDiagnosisCodeInOrderByLevelAscCreatedAtDesc(UUID userId, List<String> diagnosisCodes);
    java.util.Optional<RiskChecklistItem> findByUserIdAndSourceTypeAndDiagnosisCode(
            UUID userId, RiskChecklistItem.SourceType sourceType, String diagnosisCode);
}
