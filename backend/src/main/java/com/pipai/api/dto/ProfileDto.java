package com.pipai.api.dto;

import com.pipai.domain.CompanyProfile;

import java.time.Instant;
import java.util.List;

public record ProfileDto(
        String id,
        BasicInfo basicInfo,
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
        FuturePlan futurePlan,
        CctvExtra cctvExtra,
        MarketingExtra marketingExtra,
        Instant updatedAt) {

    public record BasicInfo(
            String companyName,
            String representativeName,
            String businessRegistrationNumber,
            String entityType,
            String foundingYear,
            String companyPhone,
            String companyAddress) {}

    public record Overview(
            String businessType,
            String industryDetail,
            Integer employeeCount,
            String annualRevenue,
            String largeAssets,
            String subjectRange,
            String personalDataItems,
            Boolean hasPrivacyPolicy,
            String sensitiveDataTypes,
            String generalOther,
            String collectionMethods,
            String collectionPurposes,
            String marketingScope,
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
    public record ProvisionInfo(String status, String purpose, String recipients, String consentStatus) {}
    public record InternalPlanInfo(String status, String cycle) {}
    public record FuturePlan(String plans, String employees, String revenue, String subjectScale, String newBiz) {}
    public record CctvExtra(String websiteUrl, String appName, String marketplaceSource,
                            String cctvLoc, String cctvLocOther, String cctvRetention) {}
    public record MarketingExtra(String channels, String consentTiming) {}

    public record ProfileRequest(
            BasicInfo basicInfo,
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
            FuturePlan futurePlan,
            CctvExtra cctvExtra,
            MarketingExtra marketingExtra) {}

    public static ProfileDto from(CompanyProfile profile) {
        return new ProfileDto(
                profile.getId().toString(),
                new BasicInfo(
                        profile.getCompanyName(),
                        profile.getRepresentativeName(),
                        profile.getBusinessRegistrationNumber(),
                        profile.getEntityType(),
                        profile.getFoundingYear(),
                        profile.getCompanyPhone(),
                        profile.getCompanyAddress()
                ),
                new Overview(
                        profile.getBusinessType(),
                        profile.getIndustryDetail(),
                        profile.getEmployeeCount(),
                        profile.getAnnualRevenue(),
                        profile.getLargeAssets(),
                        profile.getSubjectRange(),
                        profile.getPersonalDataItems(),
                        profile.getHasPrivacyPolicy(),
                        profile.getSensitiveDataTypes(),
                        profile.getGeneralOther(),
                        profile.getCollectionMethods(),
                        profile.getCollectionPurposes(),
                        profile.getMarketingScope(),
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
                new ProvisionInfo(profile.getProvisionStatus(), profile.getProvisionPurpose(),
                        profile.getProvisionRecipients(), profile.getProvisionConsentStatus()),
                new InternalPlanInfo(profile.getInternalPlanStatus(), profile.getInternalPlanCycle()),
                new FuturePlan(profile.getFuturePlans(), profile.getFutureEmployees(),
                        profile.getFutureRevenue(), profile.getFutureSubjectScale(), profile.getNewBiz()),
                new CctvExtra(profile.getWebsiteUrl(), profile.getAppName(), profile.getMarketplaceSource(),
                        profile.getCctvLoc(), profile.getCctvLocOther(), profile.getCctvRetention()),
                new MarketingExtra(profile.getMarketingChannels(), profile.getMarketingConsentTiming()),
                profile.getUpdatedAt()
        );
    }

    public static ProfileDto empty() {
        BasicInfo emptyBasic = new BasicInfo(null, null, null, null, null, null, null);
        Overview emptyOverview = new Overview(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        return new ProfileDto(
                "",
                emptyBasic,
                emptyOverview,
                new Destruction(null, null),
                new EmploymentRetention(null, null),
                new PartnerContactHandling(null, null),
                new PrivacyPolicyCompleteness(null),
                new DelegationGovernance(null, null, null),
                new CloudHosting(null, null),
                new CctvControls(null, null),
                new SecurityControls(null, null, null, null),
                new CpoInfo(null, null),
                new OperatingInfo(null, null),
                new DelegationContracts(null),
                new MarketingInfo(null, null, null),
                new CctvAdditional(null, null),
                new AccessLogInfo(null),
                new JuminInfo(null),
                new ProvisionInfo(null, null, null, null),
                new InternalPlanInfo(null, null),
                new FuturePlan(null, null, null, null, null),
                new CctvExtra(null, null, null, null, null, null),
                new MarketingExtra(null, null),
                null
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
