package com.pipai.api.dto;

import com.pipai.domain.RiskChecklistItem;

import java.time.Instant;

public record DashboardRiskItemDto(
        String id,
        String title,
        String description,
        RiskChecklistItem.RiskLevel level,
        String relatedLaw,
        boolean resolved,
        String diagnosisCode,
        RiskChecklistItem.SourceType sourceType,
        String sourceConversationId,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt) {

    public static DashboardRiskItemDto from(RiskChecklistItem item) {
        return new DashboardRiskItemDto(
                item.getId().toString(),
                item.getTitle(),
                item.getDescription(),
                item.getLevel(),
                item.getRelatedLaw(),
                item.isResolved(),
                item.getDiagnosisCode(),
                item.getSourceType(),
                item.getSourceConversationId() != null ? item.getSourceConversationId().toString() : null,
                item.getResolvedAt(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
