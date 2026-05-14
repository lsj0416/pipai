package com.pipai.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "company_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 100)
    private String businessType;  // 업종

    @Column
    private Integer employeeCount;

    @Column(length = 50)
    private String annualRevenue;  // 매출 규모

    // 수집 개인정보 항목 (콤마 구분)
    @Column(columnDefinition = "text")
    private String personalDataItems;

    // 개인정보처리방침 보유 여부
    @Column
    private Boolean hasPrivacyPolicy;

    // 처리하는 민감정보 유형
    @Column(columnDefinition = "text")
    private String sensitiveDataTypes;

    // AI 전용 누적 상담 요약 메모 (사용자에게 비노출)
    @Column(columnDefinition = "text")
    private String hiddenMemo;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static CompanyProfile create(User user) {
        CompanyProfile profile = new CompanyProfile();
        profile.user = user;
        return profile;
    }

    public void update(String businessType, Integer employeeCount, String annualRevenue,
                       String personalDataItems, Boolean hasPrivacyPolicy, String sensitiveDataTypes) {
        this.businessType = businessType;
        this.employeeCount = employeeCount;
        this.annualRevenue = annualRevenue;
        this.personalDataItems = personalDataItems;
        this.hasPrivacyPolicy = hasPrivacyPolicy;
        this.sensitiveDataTypes = sensitiveDataTypes;
    }

    public void appendHiddenMemo(String entry) {
        this.hiddenMemo = (hiddenMemo == null || hiddenMemo.isBlank()) ? entry : hiddenMemo + "\n" + entry;
    }
}
