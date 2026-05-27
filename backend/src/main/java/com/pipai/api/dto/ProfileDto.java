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

    public record ProfileRequest(
            Overview overview,
            Destruction destruction,
            EmploymentRetention employmentRetention,
            PartnerContactHandling partnerContactHandling,
            PrivacyPolicyCompleteness privacyPolicyCompleteness,
            DelegationGovernance delegationGovernance,
            CloudHosting cloudHosting,
            CctvControls cctvControls,
            SecurityControls securityControls) {}

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
