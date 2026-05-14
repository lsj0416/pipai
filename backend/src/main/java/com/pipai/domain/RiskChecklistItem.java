package com.pipai.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "risk_checklist_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RiskChecklistItem {

    public enum RiskLevel { IMMEDIATE, CHECK_NEEDED, GOOD }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RiskLevel level;

    // 관련 법령 조문 (예: 개인정보보호법 제29조)
    @Column(length = 200)
    private String relatedLaw;

    @Column(nullable = false)
    private boolean resolved;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static RiskChecklistItem create(User user, String title, String description,
                                           RiskLevel level, String relatedLaw) {
        RiskChecklistItem item = new RiskChecklistItem();
        item.user = user;
        item.title = title;
        item.description = description;
        item.level = level;
        item.relatedLaw = relatedLaw;
        item.resolved = false;
        return item;
    }

    public void resolve() {
        this.resolved = true;
    }
}
