package com.pipai.service;

import com.pipai.domain.CompanyProfile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DiagnosisFieldMapper {

    private static final Map<String, List<String>> FIELD_MAP = Map.ofEntries(
        Map.entry("A-01", List.of("employeeCount", "businessType", "annualRevenue")),
        Map.entry("A-02", List.of("employeeCount", "cpoStatus", "cpoTitle")),
        Map.entry("A-03", List.of("subjectRange")),
        Map.entry("A-04", List.of("cctvOperationStatus", "cctvSignageStatus")),
        Map.entry("A-05", List.of("operatingChannels", "hasPrivacyPolicy")),
        Map.entry("A-06", List.of("delegationStatus", "contractPerType")),
        Map.entry("A-07", List.of("marketingStatus", "marketingConsentType")),
        Map.entry("A-08", List.of("systemStatus", "accessLogStatus")),
        Map.entry("A-09", List.of("personalDataItems", "collectionPurposes")),
        Map.entry("A-10", List.of("marketingStatus", "marketingChannels", "personalDataItems")),
        Map.entry("A-11", List.of("collectionPurposes", "marketingStatus")),
        Map.entry("A-12", List.of("marketingStatus", "delegationStatus", "delegateeTypes", "contractPerType")),
        Map.entry("A-13", List.of("personalDataItems", "juminCollectionGround")),
        Map.entry("A-14", List.of("sensitiveDataTypes", "personalDataItems")),
        Map.entry("A-15", List.of("personalDataItems")),
        Map.entry("A-16", List.of("provisionStatus", "provisionConsentStatus")),
        Map.entry("A-17", List.of("delegateeTypes", "overseasTransferStatus")),
        Map.entry("A-18", List.of("operatingChannels", "privacyPolicyUrl", "hasPrivacyPolicy")),
        Map.entry("A-19", List.of("employeeCount", "systemStatus", "internalPlanStatus", "internalPlanCycle")),
        Map.entry("A-20", List.of("systemStatus", "encryptionStatus", "personalDataItems")),
        Map.entry("A-21", List.of("cctvOperationStatus", "cctvRange")),
        Map.entry("A-22", List.of("marketingStatus", "marketingNightSend")),
        Map.entry("A-23", List.of("operatingChannels", "marketplaceSource")),
        Map.entry("A-24", List.of("futureEmployees", "futureRevenue", "futureSubjectScale", "newBiz")),
        Map.entry("A-25", List.of("delegationStatus", "hasPrivacyPolicy")),
        Map.entry("A-26", List.of("systemStatus")),
        Map.entry("B-01", List.of("delegateeDisclosureStatus")),
        Map.entry("B-02", List.of("delegateeAuditStatus", "delegateeEducationStatus")),
        Map.entry("B-03", List.of("encryptionStatus", "encryptedDataItems")),
        Map.entry("B-04", List.of("accessControlSeparation", "retiredAccessRevocation", "accessChangeHistoryStatus")),
        Map.entry("B-05", List.of("cctvExternalProvision", "cctvAccessControl")),
        Map.entry("B-06", List.of("formerEmployeeDestructionTiming", "employmentDocumentRetention")),
        Map.entry("B-07", List.of("partnerContactDbRegistration", "partnerContactRetention")),
        Map.entry("B-08", List.of("destructionPolicyStatus", "destructionMethods")),
        Map.entry("B-09", List.of("hasPrivacyPolicy", "privacyPolicyIncludedItems")),
        Map.entry("B-10", List.of("cloudServerLocation", "overseasServerCountry")),
        Map.entry("B-11", List.of("delegateeDisclosureStatus"))
    );

    static final Map<String, String> FIELD_LABELS = Map.ofEntries(
        Map.entry("employeeCount", "직원(상시 근로자) 수"),
        Map.entry("businessType", "업종"),
        Map.entry("annualRevenue", "연간 매출 규모"),
        Map.entry("subjectRange", "개인정보 처리 정보주체 규모"),
        Map.entry("cpoStatus", "개인정보보호책임자(CPO) 지정 여부"),
        Map.entry("cpoTitle", "CPO 직책"),
        Map.entry("cctvOperationStatus", "CCTV 운영 여부"),
        Map.entry("cctvSignageStatus", "CCTV 안내판 설치 여부"),
        Map.entry("cctvRange", "CCTV 촬영 범위"),
        Map.entry("operatingChannels", "사업 운영 채널(웹사이트/앱/오프라인 등)"),
        Map.entry("hasPrivacyPolicy", "개인정보처리방침 게시 여부"),
        Map.entry("privacyPolicyUrl", "처리방침 URL"),
        Map.entry("delegationStatus", "개인정보 처리 위탁 여부"),
        Map.entry("contractPerType", "수탁자별 계약 형태"),
        Map.entry("marketingStatus", "마케팅 발송 여부"),
        Map.entry("marketingConsentType", "마케팅 수신 동의 방식"),
        Map.entry("marketingNightSend", "야간 마케팅 발송 여부"),
        Map.entry("marketingChannels", "마케팅 발송 채널"),
        Map.entry("systemStatus", "개인정보 처리 시스템 현황"),
        Map.entry("accessLogStatus", "접속기록 보관 여부"),
        Map.entry("encryptionStatus", "암호화 처리 여부"),
        Map.entry("encryptedDataItems", "암호화 적용 항목"),
        Map.entry("juminCollectionGround", "주민등록번호 수집 근거"),
        Map.entry("provisionStatus", "개인정보 제3자 제공 여부"),
        Map.entry("provisionConsentStatus", "제3자 제공 동의 수취 여부"),
        Map.entry("internalPlanStatus", "내부관리계획 수립 여부"),
        Map.entry("internalPlanCycle", "내부관리계획 갱신 주기"),
        Map.entry("delegateeTypes", "수탁자 유형"),
        Map.entry("overseasTransferStatus", "국외 이전 여부"),
        Map.entry("delegateeDisclosureStatus", "처리방침 내 수탁자 공개 수준"),
        Map.entry("delegateeAuditStatus", "수탁자 점검 주기"),
        Map.entry("delegateeEducationStatus", "수탁자 교육 실시 여부"),
        Map.entry("accessControlSeparation", "직원별 접근권한 분리 여부"),
        Map.entry("retiredAccessRevocation", "퇴직자 권한 회수 여부"),
        Map.entry("accessChangeHistoryStatus", "권한 변경 이력 기록 여부"),
        Map.entry("cloudServerLocation", "클라우드 서버 위치"),
        Map.entry("overseasServerCountry", "국외 서버 소재 국가"),
        Map.entry("cctvExternalProvision", "CCTV 영상 외부 제공 여부"),
        Map.entry("cctvAccessControl", "CCTV 접근 통제 방식"),
        Map.entry("formerEmployeeDestructionTiming", "퇴사자 개인정보 파기 시점"),
        Map.entry("employmentDocumentRetention", "이력서 보관 기간"),
        Map.entry("partnerContactDbRegistration", "거래처 연락처 DB 등록 여부"),
        Map.entry("partnerContactRetention", "거래 종료 후 거래처 정보 보관"),
        Map.entry("destructionPolicyStatus", "파기 절차 수립 여부"),
        Map.entry("destructionMethods", "파기 방법"),
        Map.entry("privacyPolicyIncludedItems", "처리방침 필수 기재사항 포함 항목"),
        Map.entry("marketplaceSource", "오픈마켓 고객정보 수령 방식"),
        Map.entry("futureEmployees", "향후 직원 변화 계획"),
        Map.entry("futureRevenue", "향후 매출 변화 계획"),
        Map.entry("futureSubjectScale", "향후 정보주체 규모 변화 예상"),
        Map.entry("newBiz", "향후 신규 사업/기술 도입 계획"),
        Map.entry("sensitiveDataTypes", "처리하는 민감정보 유형"),
        Map.entry("personalDataItems", "수집 개인정보 항목"),
        Map.entry("collectionPurposes", "수집 목적")
    );

    public record MissingField(String diagnosisCode, String fieldName, String label) {}

    public List<MissingField> getMissingFields(CompanyProfile profile) {
        List<MissingField> result = new ArrayList<>();
        FIELD_MAP.forEach((code, fields) -> {
            for (String field : fields) {
                if (isFieldEmpty(profile, field)) {
                    result.add(new MissingField(code, field, FIELD_LABELS.getOrDefault(field, field)));
                    break;
                }
            }
        });
        return result;
    }

    public boolean isFieldEmpty(CompanyProfile profile, String fieldName) {
        if (profile == null) return true;
        return switch (fieldName) {
            case "employeeCount" -> profile.getEmployeeCount() == null;
            case "hasPrivacyPolicy" -> profile.getHasPrivacyPolicy() == null;
            case "businessType" -> isBlank(profile.getBusinessType());
            case "annualRevenue" -> isBlank(profile.getAnnualRevenue());
            case "subjectRange" -> isBlank(profile.getSubjectRange());
            case "cpoStatus" -> isBlank(profile.getCpoStatus());
            case "cpoTitle" -> isBlank(profile.getCpoTitle());
            case "cctvOperationStatus" -> isBlank(profile.getCctvOperationStatus());
            case "cctvSignageStatus" -> isBlank(profile.getCctvSignageStatus());
            case "cctvRange" -> isBlank(profile.getCctvRange());
            case "operatingChannels" -> isBlank(profile.getOperatingChannels());
            case "privacyPolicyUrl" -> isBlank(profile.getPrivacyPolicyUrl());
            case "delegationStatus" -> isBlank(profile.getDelegationStatus());
            case "contractPerType" -> isBlank(profile.getContractPerType());
            case "marketingStatus" -> isBlank(profile.getMarketingStatus());
            case "marketingConsentType" -> isBlank(profile.getMarketingConsentType());
            case "marketingNightSend" -> isBlank(profile.getMarketingNightSend());
            case "marketingChannels" -> isBlank(profile.getMarketingChannels());
            case "systemStatus" -> isBlank(profile.getSystemStatus());
            case "accessLogStatus" -> isBlank(profile.getAccessLogStatus());
            case "encryptionStatus" -> isBlank(profile.getEncryptionStatus());
            case "encryptedDataItems" -> isBlank(profile.getEncryptedDataItems());
            case "juminCollectionGround" -> isBlank(profile.getJuminCollectionGround());
            case "provisionStatus" -> isBlank(profile.getProvisionStatus());
            case "provisionConsentStatus" -> isBlank(profile.getProvisionConsentStatus());
            case "internalPlanStatus" -> isBlank(profile.getInternalPlanStatus());
            case "internalPlanCycle" -> isBlank(profile.getInternalPlanCycle());
            case "delegateeTypes" -> isBlank(profile.getDelegateeTypes());
            case "overseasTransferStatus" -> isBlank(profile.getOverseasTransferStatus());
            case "delegateeDisclosureStatus" -> isBlank(profile.getDelegateeDisclosureStatus());
            case "delegateeAuditStatus" -> isBlank(profile.getDelegateeAuditStatus());
            case "delegateeEducationStatus" -> isBlank(profile.getDelegateeEducationStatus());
            case "accessControlSeparation" -> isBlank(profile.getAccessControlSeparation());
            case "retiredAccessRevocation" -> isBlank(profile.getRetiredAccessRevocation());
            case "accessChangeHistoryStatus" -> isBlank(profile.getAccessChangeHistoryStatus());
            case "cloudServerLocation" -> isBlank(profile.getCloudServerLocation());
            case "overseasServerCountry" -> isBlank(profile.getOverseasServerCountry());
            case "cctvExternalProvision" -> isBlank(profile.getCctvExternalProvision());
            case "cctvAccessControl" -> isBlank(profile.getCctvAccessControl());
            case "formerEmployeeDestructionTiming" -> isBlank(profile.getFormerEmployeeDestructionTiming());
            case "employmentDocumentRetention" -> isBlank(profile.getEmploymentDocumentRetention());
            case "partnerContactDbRegistration" -> isBlank(profile.getPartnerContactDbRegistration());
            case "partnerContactRetention" -> isBlank(profile.getPartnerContactRetention());
            case "destructionPolicyStatus" -> isBlank(profile.getDestructionPolicyStatus());
            case "destructionMethods" -> isBlank(profile.getDestructionMethods());
            case "privacyPolicyIncludedItems" -> isBlank(profile.getPrivacyPolicyIncludedItems());
            case "sensitiveDataTypes" -> isBlank(profile.getSensitiveDataTypes());
            case "personalDataItems" -> isBlank(profile.getPersonalDataItems());
            case "collectionPurposes" -> isBlank(profile.getCollectionPurposes());
            case "marketplaceSource" -> isBlank(profile.getMarketplaceSource());
            case "futureEmployees" -> isBlank(profile.getFutureEmployees());
            case "futureRevenue" -> isBlank(profile.getFutureRevenue());
            case "futureSubjectScale" -> isBlank(profile.getFutureSubjectScale());
            case "newBiz" -> isBlank(profile.getNewBiz());
            default -> false;
        };
    }

    private boolean isBlank(String v) { return v == null || v.isBlank(); }
}
