package com.pipai.api.dto;

import com.pipai.domain.CompanyProfile;

import java.time.Instant;
import java.util.List;

public record ProfileDto(
        String id,
        Overview overview,
        Destruction destruction,
        EmploymentRetention employmentRetention,
        PartnerContactHandling partnerContactHandling,
        PrivacyPolicyCompleteness privacyPolicyCompleteness,
        DelegationGovernance delegationGovernance,
        CloudHosting cloudHosting,
        CctvControls cctvControls,
        SecurityControls securityControls,
        CpoInfo cpoInfo,
        OperatingInfo operatingInfo,
        DelegationContracts delegationContracts,
        MarketingInfo marketingInfo,
        CctvAdditional cctvAdditional,
        AccessLogInfo accessLogInfo,
        JuminInfo juminInfo,
        ProvisionInfo provisionInfo,
        InternalPlanInfo internalPlanInfo,
        Instant updatedAt) {

    public record Overview(
            String businessType,
            Integer employeeCount,
            String annualRevenue,
            String personalDataItems,
            Boolean hasPrivacyPolicy,
            String sensitiveDataTypes,
            String collectionMethods,
            String collectionPurposes,
            String delegationStatus,
            String delegateeTypes,
            String overseasTransferStatus,
            String overseasTransferCountry,
            String cctvOperationStatus,
            String systemStatus,
            String encryptionStatus) {}

    public record Destruction(String policyStatus, String methods) {}
    public record EmploymentRetention(String documentRetention, String formerEmployeeDestructionTiming) {}
    public record PartnerContactHandling(String dbRegistration, String retentionPolicy) {}
    public record PrivacyPolicyCompleteness(String includedItems) {}
    public record DelegationGovernance(String disclosureStatus, String auditStatus, String educationStatus) {}
    public record CloudHosting(String serverLocation, String overseasServerCountry) {}
    public record CctvControls(String externalProvision, String accessControl) {}
    public record SecurityControls(
            String encryptedDataItems,
            String accessControlSeparation,
            String retiredAccessRevocation,
            String accessChangeHistoryStatus) {}

    public record CpoInfo(String status, String title) {}
    public record OperatingInfo(String channels, String privacyPolicyUrl) {}
    public record DelegationContracts(String contractPerType) {}
    public record MarketingInfo(String status, String consentType, String nightSend) {}
    public record CctvAdditional(String signageStatus, String range) {}
    public record AccessLogInfo(String status) {}
    public record JuminInfo(String collectionGround) {}
    public record ProvisionInfo(String status, String consentStatus) {}
    public record InternalPlanInfo(String status, String cycle) {}

    public record ProfileRequest(
            Overview overview,
            Destruction destruction,
            EmploymentRetention employmentRetention,
            PartnerContactHandling partnerContactHandling,
            PrivacyPolicyCompleteness privacyPolicyCompleteness,
            DelegationGovernance delegationGovernance,
            CloudHosting cloudHosting,
            CctvControls cctvControls,
            SecurityControls securityControls,
            CpoInfo cpoInfo,
            OperatingInfo operatingInfo,
            DelegationContracts delegationContracts,
            MarketingInfo marketingInfo,
            CctvAdditional cctvAdditional,
            AccessLogInfo accessLogInfo,
            JuminInfo juminInfo,
            ProvisionInfo provisionInfo,
            InternalPlanInfo internalPlanInfo) {}

    public static ProfileDto from(CompanyProfile profile) {
        return new ProfileDto(
                profile.getId().toString(),
                new Overview(
                        profile.getBusinessType(),
                        profile.getEmployeeCount(),
                        profile.getAnnualRevenue(),
                        profile.getPersonalDataItems(),
                        profile.getHasPrivacyPolicy(),
                        profile.getSensitiveDataTypes(),
                        profile.getCollectionMethods(),
                        profile.getCollectionPurposes(),
                        profile.getDelegationStatus(),
                        profile.getDelegateeTypes(),
                        profile.getOverseasTransferStatus(),
                        profile.getOverseasTransferCountry(),
                        profile.getCctvOperationStatus(),
                        profile.getSystemStatus(),
                        profile.getEncryptionStatus()
                ),
                new Destruction(profile.getDestructionPolicyStatus(), profile.getDestructionMethods()),
                new EmploymentRetention(profile.getEmploymentDocumentRetention(), profile.getFormerEmployeeDestructionTiming()),
                new PartnerContactHandling(profile.getPartnerContactDbRegistration(), profile.getPartnerContactRetention()),
                new PrivacyPolicyCompleteness(profile.getPrivacyPolicyIncludedItems()),
                new DelegationGovernance(
                        profile.getDelegateeDisclosureStatus(),
                        profile.getDelegateeAuditStatus(),
                        profile.getDelegateeEducationStatus()
                ),
                new CloudHosting(profile.getCloudServerLocation(), profile.getOverseasServerCountry()),
                new CctvControls(profile.getCctvExternalProvision(), profile.getCctvAccessControl()),
                new SecurityControls(
                        profile.getEncryptedDataItems(),
                        profile.getAccessControlSeparation(),
                        profile.getRetiredAccessRevocation(),
                        profile.getAccessChangeHistoryStatus()
                ),
                new CpoInfo(profile.getCpoStatus(), profile.getCpoTitle()),
                new OperatingInfo(profile.getOperatingChannels(), profile.getPrivacyPolicyUrl()),
                new DelegationContracts(profile.getContractPerType()),
                new MarketingInfo(profile.getMarketingStatus(), profile.getMarketingConsentType(), profile.getMarketingNightSend()),
                new CctvAdditional(profile.getCctvSignageStatus(), profile.getCctvRange()),
                new AccessLogInfo(profile.getAccessLogStatus()),
                new JuminInfo(profile.getJuminCollectionGround()),
                new ProvisionInfo(profile.getProvisionStatus(), profile.getProvisionConsentStatus()),
                new InternalPlanInfo(profile.getInternalPlanStatus(), profile.getInternalPlanCycle()),
                profile.getUpdatedAt()
        );
    }

    public static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(",")).stream()
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .toList();
    }
}
