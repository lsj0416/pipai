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

    // 수집 방법 (콤마 구분)
    @Column(columnDefinition = "text")
    private String collectionMethods;

    @Column(columnDefinition = "text")
    private String collectionPurposes;

    @Column(length = 30)
    private String delegationStatus;

    @Column(columnDefinition = "text")
    private String delegateeTypes;

    @Column(length = 30)
    private String overseasTransferStatus;

    @Column(length = 100)
    private String overseasTransferCountry;

    @Column(length = 30)
    private String cctvOperationStatus;

    @Column(length = 100)
    private String systemStatus;

    @Column(length = 50)
    private String encryptionStatus;

    @Column(length = 100)
    private String destructionPolicyStatus;

    @Column(columnDefinition = "text")
    private String destructionMethods;

    @Column(length = 100)
    private String employmentDocumentRetention;

    @Column(length = 100)
    private String formerEmployeeDestructionTiming;

    @Column(length = 100)
    private String partnerContactDbRegistration;

    @Column(length = 100)
    private String partnerContactRetention;

    @Column(columnDefinition = "text")
    private String privacyPolicyIncludedItems;

    @Column(length = 150)
    private String delegateeDisclosureStatus;

    @Column(length = 100)
    private String delegateeAuditStatus;

    @Column(length = 100)
    private String delegateeEducationStatus;

    @Column(length = 100)
    private String cloudServerLocation;

    @Column(length = 100)
    private String overseasServerCountry;

    @Column(length = 100)
    private String cctvExternalProvision;

    @Column(length = 100)
    private String cctvAccessControl;

    @Column(columnDefinition = "text")
    private String encryptedDataItems;

    @Column(length = 100)
    private String accessControlSeparation;

    @Column(length = 100)
    private String retiredAccessRevocation;

    @Column(length = 100)
    private String accessChangeHistoryStatus;

    // ── A 섹션 진단 필드 (Phase 3) ──────────────────────────────────────────────
    @Column(length = 20)
    private String cpoStatus;

    @Column(length = 100)
    private String cpoTitle;

    @Column(columnDefinition = "text")
    private String operatingChannels;

    @Column(length = 500)
    private String privacyPolicyUrl;

    @Column(columnDefinition = "text")
    private String contractPerType;

    @Column(length = 20)
    private String marketingStatus;

    @Column(length = 30)
    private String marketingConsentType;

    @Column(length = 20)
    private String marketingNightSend;

    @Column(length = 20)
    private String cctvSignageStatus;

    @Column(columnDefinition = "text")
    private String cctvRange;

    @Column(length = 20)
    private String accessLogStatus;

    @Column(length = 30)
    private String juminCollectionGround;

    @Column(length = 20)
    private String provisionStatus;

    @Column(length = 20)
    private String provisionConsentStatus;

    @Column(length = 20)
    private String internalPlanStatus;

    @Column(length = 30)
    private String internalPlanCycle;

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
                       String personalDataItems, Boolean hasPrivacyPolicy, String sensitiveDataTypes,
                       String collectionMethods, String collectionPurposes, String delegationStatus,
                       String delegateeTypes, String overseasTransferStatus, String overseasTransferCountry,
                       String cctvOperationStatus, String systemStatus, String encryptionStatus,
                       String destructionPolicyStatus, String destructionMethods,
                       String employmentDocumentRetention, String formerEmployeeDestructionTiming,
                       String partnerContactDbRegistration, String partnerContactRetention,
                       String privacyPolicyIncludedItems, String delegateeDisclosureStatus,
                       String delegateeAuditStatus, String delegateeEducationStatus,
                       String cloudServerLocation, String overseasServerCountry,
                       String cctvExternalProvision, String cctvAccessControl,
                       String encryptedDataItems, String accessControlSeparation,
                       String retiredAccessRevocation, String accessChangeHistoryStatus,
                       String cpoStatus, String cpoTitle, String operatingChannels, String privacyPolicyUrl,
                       String contractPerType, String marketingStatus, String marketingConsentType,
                       String marketingNightSend, String cctvSignageStatus, String cctvRange,
                       String accessLogStatus, String juminCollectionGround,
                       String provisionStatus, String provisionConsentStatus,
                       String internalPlanStatus, String internalPlanCycle) {
        this.businessType = businessType;
        this.employeeCount = employeeCount;
        this.annualRevenue = annualRevenue;
        this.personalDataItems = personalDataItems;
        this.hasPrivacyPolicy = hasPrivacyPolicy;
        this.sensitiveDataTypes = sensitiveDataTypes;
        this.collectionMethods = collectionMethods;
        this.collectionPurposes = collectionPurposes;
        this.delegationStatus = delegationStatus;
        this.delegateeTypes = delegateeTypes;
        this.overseasTransferStatus = overseasTransferStatus;
        this.overseasTransferCountry = overseasTransferCountry;
        this.cctvOperationStatus = cctvOperationStatus;
        this.systemStatus = systemStatus;
        this.encryptionStatus = encryptionStatus;
        this.destructionPolicyStatus = destructionPolicyStatus;
        this.destructionMethods = destructionMethods;
        this.employmentDocumentRetention = employmentDocumentRetention;
        this.formerEmployeeDestructionTiming = formerEmployeeDestructionTiming;
        this.partnerContactDbRegistration = partnerContactDbRegistration;
        this.partnerContactRetention = partnerContactRetention;
        this.privacyPolicyIncludedItems = privacyPolicyIncludedItems;
        this.delegateeDisclosureStatus = delegateeDisclosureStatus;
        this.delegateeAuditStatus = delegateeAuditStatus;
        this.delegateeEducationStatus = delegateeEducationStatus;
        this.cloudServerLocation = cloudServerLocation;
        this.overseasServerCountry = overseasServerCountry;
        this.cctvExternalProvision = cctvExternalProvision;
        this.cctvAccessControl = cctvAccessControl;
        this.encryptedDataItems = encryptedDataItems;
        this.accessControlSeparation = accessControlSeparation;
        this.retiredAccessRevocation = retiredAccessRevocation;
        this.accessChangeHistoryStatus = accessChangeHistoryStatus;
        this.cpoStatus = cpoStatus;
        this.cpoTitle = cpoTitle;
        this.operatingChannels = operatingChannels;
        this.privacyPolicyUrl = privacyPolicyUrl;
        this.contractPerType = contractPerType;
        this.marketingStatus = marketingStatus;
        this.marketingConsentType = marketingConsentType;
        this.marketingNightSend = marketingNightSend;
        this.cctvSignageStatus = cctvSignageStatus;
        this.cctvRange = cctvRange;
        this.accessLogStatus = accessLogStatus;
        this.juminCollectionGround = juminCollectionGround;
        this.provisionStatus = provisionStatus;
        this.provisionConsentStatus = provisionConsentStatus;
        this.internalPlanStatus = internalPlanStatus;
        this.internalPlanCycle = internalPlanCycle;
    }

    public void patchField(String field, String value) {
        switch (field) {
            case "employeeCount" -> {
                try { this.employeeCount = Integer.parseInt(value.trim()); } catch (NumberFormatException ignored) {}
            }
            case "hasPrivacyPolicy" -> this.hasPrivacyPolicy = Boolean.parseBoolean(value);
            case "businessType" -> this.businessType = value;
            case "annualRevenue" -> this.annualRevenue = value;
            case "personalDataItems" -> this.personalDataItems = value;
            case "sensitiveDataTypes" -> this.sensitiveDataTypes = value;
            case "collectionMethods" -> this.collectionMethods = value;
            case "collectionPurposes" -> this.collectionPurposes = value;
            case "delegationStatus" -> this.delegationStatus = value;
            case "delegateeTypes" -> this.delegateeTypes = value;
            case "overseasTransferStatus" -> this.overseasTransferStatus = value;
            case "overseasTransferCountry" -> this.overseasTransferCountry = value;
            case "cctvOperationStatus" -> this.cctvOperationStatus = value;
            case "systemStatus" -> this.systemStatus = value;
            case "encryptionStatus" -> this.encryptionStatus = value;
            case "destructionPolicyStatus" -> this.destructionPolicyStatus = value;
            case "destructionMethods" -> this.destructionMethods = value;
            case "employmentDocumentRetention" -> this.employmentDocumentRetention = value;
            case "formerEmployeeDestructionTiming" -> this.formerEmployeeDestructionTiming = value;
            case "partnerContactDbRegistration" -> this.partnerContactDbRegistration = value;
            case "partnerContactRetention" -> this.partnerContactRetention = value;
            case "privacyPolicyIncludedItems" -> this.privacyPolicyIncludedItems = value;
            case "delegateeDisclosureStatus" -> this.delegateeDisclosureStatus = value;
            case "delegateeAuditStatus" -> this.delegateeAuditStatus = value;
            case "delegateeEducationStatus" -> this.delegateeEducationStatus = value;
            case "cloudServerLocation" -> this.cloudServerLocation = value;
            case "overseasServerCountry" -> this.overseasServerCountry = value;
            case "cctvExternalProvision" -> this.cctvExternalProvision = value;
            case "cctvAccessControl" -> this.cctvAccessControl = value;
            case "encryptedDataItems" -> this.encryptedDataItems = value;
            case "accessControlSeparation" -> this.accessControlSeparation = value;
            case "retiredAccessRevocation" -> this.retiredAccessRevocation = value;
            case "accessChangeHistoryStatus" -> this.accessChangeHistoryStatus = value;
            case "cpoStatus" -> this.cpoStatus = value;
            case "cpoTitle" -> this.cpoTitle = value;
            case "operatingChannels" -> this.operatingChannels = value;
            case "privacyPolicyUrl" -> this.privacyPolicyUrl = value;
            case "contractPerType" -> this.contractPerType = value;
            case "marketingStatus" -> this.marketingStatus = value;
            case "marketingConsentType" -> this.marketingConsentType = value;
            case "marketingNightSend" -> this.marketingNightSend = value;
            case "cctvSignageStatus" -> this.cctvSignageStatus = value;
            case "cctvRange" -> this.cctvRange = value;
            case "accessLogStatus" -> this.accessLogStatus = value;
            case "juminCollectionGround" -> this.juminCollectionGround = value;
            case "provisionStatus" -> this.provisionStatus = value;
            case "provisionConsentStatus" -> this.provisionConsentStatus = value;
            case "internalPlanStatus" -> this.internalPlanStatus = value;
            case "internalPlanCycle" -> this.internalPlanCycle = value;
        }
    }

    public void appendHiddenMemo(String entry) {
        this.hiddenMemo = (hiddenMemo == null || hiddenMemo.isBlank()) ? entry : hiddenMemo + "\n" + entry;
    }

    public boolean isDiagnosisReady() {
        return hasAnyValue(businessType, annualRevenue, personalDataItems, collectionMethods, collectionPurposes,
                delegationStatus, cctvOperationStatus, systemStatus, encryptionStatus)
                || employeeCount != null
                || hasPrivacyPolicy != null;
    }

    private boolean hasAnyValue(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return true;
            }
        }
        return false;
    }
}
