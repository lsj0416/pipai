package com.pipai.service;

import com.pipai.api.dto.ProfileDto;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.domain.User;
import com.pipai.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProfileDiagnosisService {

    private final RiskRepository riskRepository;

    @Transactional
    public void rediagnose(User user, CompanyProfile profile) {
        if (!profile.isDiagnosisReady()) {
            return;
        }

        for (DiagnosisSpec spec : buildSpecs(profile)) {
            upsertProfileRisk(user, spec);
        }
    }

    private void upsertProfileRisk(User user, DiagnosisSpec spec) {
        RiskChecklistItem item = riskRepository.findByUserIdAndSourceTypeAndDiagnosisCode(
                user.getId(), RiskChecklistItem.SourceType.PROFILE, spec.code()
        ).orElseGet(() -> RiskChecklistItem.create(
                user,
                spec.title(),
                spec.description(),
                spec.level(),
                spec.relatedLaw(),
                spec.code(),
                RiskChecklistItem.SourceType.PROFILE,
                null
        ));

        item.applyDiagnosis(spec.title(), spec.description(), spec.level(), spec.relatedLaw());
        if (spec.level() != RiskChecklistItem.RiskLevel.GOOD
                && spec.level() != RiskChecklistItem.RiskLevel.EXEMPT
                && item.isResolved()) {
            item.reopen();
        }
        riskRepository.save(item);
    }

    private List<DiagnosisSpec> buildSpecs(CompanyProfile profile) {
        return List.of(
                diagnoseB01(profile),
                diagnoseB02(profile),
                diagnoseB03(profile),
                diagnoseB04(profile),
                diagnoseB05(profile),
                diagnoseB06(profile),
                diagnoseB07(profile),
                diagnoseB08(profile),
                diagnoseB09(profile),
                diagnoseB10(profile),
                diagnoseB11(profile),
                diagnoseA02(profile),
                diagnoseA04(profile),
                diagnoseA05(profile),
                diagnoseA06(profile),
                diagnoseA07(profile),
                diagnoseA08(profile),
                diagnoseA09(profile),
                diagnoseA11(profile),
                diagnoseA13(profile),
                diagnoseA14(profile),
                diagnoseA16(profile),
                diagnoseA17(profile),
                diagnoseA19(profile),
                diagnoseA20(profile),
                diagnoseA21(profile),
                diagnoseA22(profile),
                diagnoseA25(profile)
        );
    }

    private DiagnosisSpec diagnoseB01(CompanyProfile profile) {
        String value = profile.getDelegateeDisclosureStatus();
        if ("공개 안 함".equals(value)) {
            return spec("B-01", "처리방침 내 수탁자 공개", "개인정보처리방침에 수탁자명, 업무 내용, 위탁 기간을 공개하지 않고 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제26조②");
        }
        if ("일부만 공개".equals(value) || "모르겠음".equals(value) || isBlank(value)) {
            return spec("B-01", "처리방침 내 수탁자 공개", "위탁 정보 공개 범위를 확인하고 처리방침에 필요한 항목을 보완해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조②");
        }
        return spec("B-01", "처리방침 내 수탁자 공개", "수탁자 공개 기준이 충족된 것으로 보입니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제26조②");
    }

    private DiagnosisSpec diagnoseB02(CompanyProfile profile) {
        List<String> issues = new ArrayList<>();
        if ("점검하지 않음".equals(profile.getDelegateeAuditStatus())) {
            issues.add("수탁자 정기 점검이 없습니다.");
        } else if ("비정기적으로 점검".equals(profile.getDelegateeAuditStatus()) || "모르겠음".equals(profile.getDelegateeAuditStatus()) || isBlank(profile.getDelegateeAuditStatus())) {
            issues.add("수탁자 점검 주기가 불명확합니다.");
        }
        if ("실시하지 않음".equals(profile.getDelegateeEducationStatus())) {
            issues.add("수탁자 보호 교육이 없습니다.");
        } else if ("모르겠음".equals(profile.getDelegateeEducationStatus()) || isBlank(profile.getDelegateeEducationStatus())) {
            issues.add("수탁자 보호 교육 여부를 확인해야 합니다.");
        }

        if (!issues.isEmpty()) {
            return spec("B-02", "수탁자 관리·감독", String.join(" ", issues), RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조④");
        }
        return spec("B-02", "수탁자 관리·감독", "수탁자 점검 및 보호 교육이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제26조④");
    }

    private DiagnosisSpec diagnoseB03(CompanyProfile profile) {
        String encryption = profile.getEncryptionStatus();
        List<String> items = ProfileDto.splitCsv(profile.getEncryptedDataItems());
        if ("암호화 안 함".equals(encryption) || items.contains("암호화 항목 없음")) {
            return spec("B-03", "개인정보 암호화", "암호화 대상 정보에 대한 보호조치가 없습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "안전조치기준 고시 제7조");
        }
        if ("일부만 암호화".equals(encryption)) {
            List<String> missing = new ArrayList<>();
            if (!items.contains("비밀번호 (해시 처리)")) missing.add("비밀번호");
            if (!items.contains("주민등록번호")) missing.add("주민등록번호");
            if (!items.contains("신용카드번호·계좌번호")) missing.add("신용카드번호·계좌번호");
            if (!missing.isEmpty()) {
                return spec("B-03", "개인정보 암호화", "필수 암호화 항목이 누락되었습니다: " + String.join(", ", missing), RiskChecklistItem.RiskLevel.IMMEDIATE, "안전조치기준 고시 제7조");
            }
            return spec("B-03", "개인정보 암호화", "암호화 범위는 일부지만 필수 항목은 적용된 것으로 보입니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "안전조치기준 고시 제7조");
        }
        if ("모르겠음".equals(encryption) || isBlank(encryption)) {
            return spec("B-03", "개인정보 암호화", "암호화 적용 범위를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "안전조치기준 고시 제7조");
        }
        return spec("B-03", "개인정보 암호화", "암호화 조치가 적용된 것으로 보입니다.", RiskChecklistItem.RiskLevel.GOOD, "안전조치기준 고시 제7조");
    }

    private DiagnosisSpec diagnoseB04(CompanyProfile profile) {
        Map<String, String> critical = new LinkedHashMap<>();
        if ("분리되어 있지 않음 (공용 계정)".equals(profile.getAccessControlSeparation())) {
            critical.put("권한 분리", "직원별 접근 권한이 분리되어 있지 않습니다.");
        }
        if ("회수하지 않음".equals(profile.getRetiredAccessRevocation())) {
            critical.put("권한 회수", "퇴직자 권한을 회수하지 않습니다.");
        }
        if ("기록하지 않음".equals(profile.getAccessChangeHistoryStatus())) {
            critical.put("권한 이력", "권한 변경 이력을 기록하지 않습니다.");
        }
        if (!critical.isEmpty()) {
            return spec("B-04", "접근 권한 통제", String.join(" ", critical.values()), RiskChecklistItem.RiskLevel.IMMEDIATE, "안전조치기준 고시 제5조");
        }

        if (Stream.of(profile.getAccessControlSeparation(), profile.getRetiredAccessRevocation(), profile.getAccessChangeHistoryStatus())
                .anyMatch(v -> isBlank(v) || "모르겠음".equals(v) || "일부만 분리".equals(v) || "일정 기간 후 회수".equals(v) || "기록하지만 3년 미만 보관".equals(v))) {
            return spec("B-04", "접근 권한 통제", "접근 권한 운영 기준을 추가 점검해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "안전조치기준 고시 제5조");
        }
        return spec("B-04", "접근 권한 통제", "권한 분리, 회수, 이력 보관 기준이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "안전조치기준 고시 제5조");
    }

    private DiagnosisSpec diagnoseB05(CompanyProfile profile) {
        if ("그 외 제3자에게 제공함".equals(profile.getCctvExternalProvision())) {
            return spec("B-05", "CCTV 영상 제공·접근 통제", "CCTV 영상을 일반 제3자에게 제공하고 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제25조·제17조");
        }
        if ("별도 관리 없음".equals(profile.getCctvAccessControl())) {
            return spec("B-05", "CCTV 영상 제공·접근 통제", "CCTV 접근 권한 통제가 없습니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "안전조치기준 고시 제5조");
        }
        if (Stream.of(profile.getCctvExternalProvision(), profile.getCctvAccessControl())
                .anyMatch(v -> isBlank(v) || "모르겠음".equals(v) || "일부 직원이 접근 가능".equals(v))) {
            return spec("B-05", "CCTV 영상 제공·접근 통제", "CCTV 제공 및 접근 통제 운영을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제25조·제17조");
        }
        return spec("B-05", "CCTV 영상 제공·접근 통제", "CCTV 제공 및 접근 통제가 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제25조·제17조");
    }

    private DiagnosisSpec diagnoseB06(CompanyProfile profile) {
        if ("보관 중 (파기 계획 없음)".equals(profile.getFormerEmployeeDestructionTiming())) {
            return spec("B-06", "직원 개인정보 보관·파기", "퇴사자 개인정보 파기 계획이 없습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제21조");
        }
        if ("별도 관리 없음".equals(profile.getEmploymentDocumentRetention())
                || isBlank(profile.getEmploymentDocumentRetention())
                || isBlank(profile.getFormerEmployeeDestructionTiming())
                || "모르겠음".equals(profile.getFormerEmployeeDestructionTiming())) {
            return spec("B-06", "직원 개인정보 보관·파기", "이력서와 퇴사자 개인정보 보관 기준을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제21조");
        }
        return spec("B-06", "직원 개인정보 보관·파기", "직원 개인정보 보관 및 파기 시점이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제21조");
    }

    private DiagnosisSpec diagnoseB07(CompanyProfile profile) {
        if ("계속 보관 중".equals(profile.getPartnerContactRetention())) {
            return spec("B-07", "거래처 연락처 정보 보관", "거래 종료 후 거래처 연락처를 계속 보관하고 있습니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제21조");
        }
        if ("모르겠음".equals(profile.getPartnerContactDbRegistration())
                || "모르겠음".equals(profile.getPartnerContactRetention())
                || isBlank(profile.getPartnerContactDbRegistration())
                || ("사내 DB·CRM에 등록함".equals(profile.getPartnerContactDbRegistration()) && isBlank(profile.getPartnerContactRetention()))) {
            return spec("B-07", "거래처 연락처 정보 보관", "거래처 연락처의 등록 및 보관 기준을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제21조");
        }
        return spec("B-07", "거래처 연락처 정보 보관", "거래처 연락처 처리 기준이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제21조");
    }

    private DiagnosisSpec diagnoseB08(CompanyProfile profile) {
        if ("별도 파기 절차 없음".equals(profile.getDestructionPolicyStatus())
                || ProfileDto.splitCsv(profile.getDestructionMethods()).contains("별도 방법 없음")) {
            return spec("B-08", "개인정보 파기 절차", "파기 절차 또는 파기 방법이 수립되어 있지 않습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "안전조치 고시 제13조");
        }
        if ("모르겠음".equals(profile.getDestructionPolicyStatus())
                || isBlank(profile.getDestructionPolicyStatus())
                || ("보유기간을 항목별로 관리하고 있음".equals(profile.getDestructionPolicyStatus()) && isBlank(profile.getDestructionMethods()))) {
            return spec("B-08", "개인정보 파기 절차", "파기 절차와 방법을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "안전조치 고시 제13조");
        }
        return spec("B-08", "개인정보 파기 절차", "파기 절차와 방법이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "안전조치 고시 제13조");
    }

    private DiagnosisSpec diagnoseB09(CompanyProfile profile) {
        List<String> items = ProfileDto.splitCsv(profile.getPrivacyPolicyIncludedItems());
        if (Boolean.FALSE.equals(profile.getHasPrivacyPolicy())) {
            return spec("B-09", "처리방침 필수 기재사항", "개인정보처리방침이 게시되어 있지 않습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제30조①");
        }
        if (items.isEmpty()) {
            return spec("B-09", "처리방침 필수 기재사항", "처리방침 필수 기재사항 포함 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제30조①");
        }
        if (items.size() < 7) {
            return spec("B-09", "처리방침 필수 기재사항", "처리방침 필수 기재사항이 일부 누락되어 있을 수 있습니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제30조①");
        }
        return spec("B-09", "처리방침 필수 기재사항", "처리방침 필수 기재사항이 포함된 것으로 보입니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제30조①");
    }

    private DiagnosisSpec diagnoseB10(CompanyProfile profile) {
        if ("국외 서버 포함 사용".equals(profile.getCloudServerLocation()) || "혼합 사용 (국내+국외)".equals(profile.getCloudServerLocation())) {
            if (isBlank(profile.getOverseasServerCountry())) {
                return spec("B-10", "클라우드 국외 이전", "국외 서버 소재 국가를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제28조의8");
            }
            if ("no".equals(profile.getOverseasTransferStatus())) {
                return spec("B-10", "클라우드 국외 이전", "국외 서버를 사용하지만 국외 이전이 없다고 응답해 추가 확인이 필요합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제28조의8");
            }
            return spec("B-10", "클라우드 국외 이전", "국외 서버 사용 사실과 소재 국가가 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제28조의8");
        }
        if ("모르겠음".equals(profile.getCloudServerLocation()) || isBlank(profile.getCloudServerLocation())) {
            return spec("B-10", "클라우드 국외 이전", "클라우드 서버 위치를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제28조의8");
        }
        return spec("B-10", "클라우드 국외 이전", "국내 서버 사용으로 판단됩니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제28조의8");
    }

    private DiagnosisSpec diagnoseB11(CompanyProfile profile) {
        String value = profile.getDelegateeDisclosureStatus();
        if ("공개 안 함".equals(value)) {
            return spec("B-11", "위탁 공개 범위", "위탁 사실과 수탁자 정보 공개가 누락되어 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제26조②");
        }
        if ("일부만 공개".equals(value) || "모르겠음".equals(value) || isBlank(value)) {
            return spec("B-11", "위탁 공개 범위", "위탁 공개 항목을 보완해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조②");
        }
        return spec("B-11", "위탁 공개 범위", "위탁 공개 항목이 확인되었습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제26조②");
    }

    // ── A 섹션 — Phase 3 (신규 필드 사용) ────────────────────────────────────────

    private DiagnosisSpec diagnoseA02(CompanyProfile profile) {
        String cpoStatus = profile.getCpoStatus();
        boolean isSmallBiz = profile.getEmployeeCount() != null && profile.getEmployeeCount() <= 4;
        if ("no".equals(cpoStatus) && isSmallBiz) {
            return spec("A-02", "CPO 지정 의무 위반", "소상공인(직원 4명 이하)은 CPO 지정 의무가 면제됩니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제31조");
        }
        if ("no".equals(cpoStatus)) {
            return spec("A-02", "CPO 지정 의무 위반", "개인정보보호책임자(CPO)를 지정하지 않았습니다. 과태료 1천만원 이하.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제31조");
        }
        if ("yes".equals(cpoStatus) && !isBlank(profile.getCpoTitle())) {
            return spec("A-02", "CPO 지정 의무 위반", "CPO가 지정되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제31조");
        }
        return spec("A-02", "CPO 지정 의무 위반", "CPO 지정 현황을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제31조");
    }

    private DiagnosisSpec diagnoseA04(CompanyProfile profile) {
        if (!"yes".equals(profile.getCctvOperationStatus())) {
            return spec("A-04", "CCTV 안내판 미설치", "CCTV를 운영하지 않아 안내판 설치 의무가 없습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제25조②");
        }
        String signage = profile.getCctvSignageStatus();
        if ("no".equals(signage)) {
            return spec("A-04", "CCTV 안내판 미설치", "CCTV를 운영하고 있으나 안내판이 설치되어 있지 않습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제25조②");
        }
        if ("yes".equals(signage)) {
            return spec("A-04", "CCTV 안내판 미설치", "CCTV 안내판이 설치되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제25조②");
        }
        return spec("A-04", "CCTV 안내판 미설치", "CCTV 안내판 설치 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제25조②");
    }

    private DiagnosisSpec diagnoseA05(CompanyProfile profile) {
        List<String> channels = ProfileDto.splitCsv(profile.getOperatingChannels());
        boolean hasOnlineChannel = channels.stream().anyMatch(c ->
                c.contains("website") || c.contains("홈페이지") || c.contains("app") || c.contains("앱") || c.contains("온라인"));
        if (hasOnlineChannel && Boolean.FALSE.equals(profile.getHasPrivacyPolicy())) {
            return spec("A-05", "처리방침 게시 의무 위반", "온라인 채널을 운영하고 있으나 개인정보처리방침이 없습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제30조");
        }
        if (Boolean.TRUE.equals(profile.getHasPrivacyPolicy())) {
            return spec("A-05", "처리방침 게시 의무 위반", "개인정보처리방침이 게시되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제30조");
        }
        return spec("A-05", "처리방침 게시 의무 위반", "처리방침 게시 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제30조");
    }

    private DiagnosisSpec diagnoseA06(CompanyProfile profile) {
        if (!"yes".equals(profile.getDelegationStatus())) {
            return spec("A-06", "위탁계약 서면 미체결", "위탁 처리를 하지 않아 서면 계약 의무가 없습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제26조①");
        }
        String contractJson = profile.getContractPerType();
        if (isBlank(contractJson)) {
            return spec("A-06", "위탁계약 서면 미체결", "수탁자별 계약 형태를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조①");
        }
        int violations = countOccurrences(contractJson, "\"verbal\"") + countOccurrences(contractJson, "\"none\"");
        if (violations > 0) {
            return spec("A-06", "위탁계약 서면 미체결", violations + "개 수탁자와 서면 계약이 체결되지 않았습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제26조①");
        }
        if (contractJson.contains("\"unknown\"")) {
            return spec("A-06", "위탁계약 서면 미체결", "일부 수탁자의 계약 형태를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조①");
        }
        return spec("A-06", "위탁계약 서면 미체결", "모든 수탁자와 서면 계약이 체결되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제26조①");
    }

    private DiagnosisSpec diagnoseA07(CompanyProfile profile) {
        if ("no".equals(profile.getMarketingStatus())) {
            return spec("A-07", "마케팅 동의 절차 위반", "마케팅 발송을 하지 않아 별도 동의 의무가 없습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제22조");
        }
        String consentType = profile.getMarketingConsentType();
        if ("required".equals(consentType) || "none".equals(consentType)) {
            return spec("A-07", "마케팅 동의 절차 위반", "마케팅 수신 동의를 필수로 받거나 동의 없이 발송하고 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제22조");
        }
        if ("separate".equals(consentType)) {
            return spec("A-07", "마케팅 동의 절차 위반", "마케팅 동의를 별도로 받고 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제22조");
        }
        return spec("A-07", "마케팅 동의 절차 위반", "마케팅 동의 절차를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제22조");
    }

    private DiagnosisSpec diagnoseA08(CompanyProfile profile) {
        String sys = profile.getSystemStatus();
        boolean paperOnly = isBlank(sys)
                || ((sys.contains("종이") || sys.contains("엑셀")) && !sys.contains("전산") && !sys.contains("시스템"));
        if (paperOnly) {
            return spec("A-08", "접속기록 미보관", "전자적 처리 시스템이 없어 접속기록 보관 의무 적용 대상이 아닙니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제29조·안전조치기준 고시 제8조");
        }
        String accessLog = profile.getAccessLogStatus();
        if ("no".equals(accessLog)) {
            return spec("A-08", "접속기록 미보관", "개인정보처리시스템 접속기록을 보관하지 않고 있습니다. 최소 6개월 이상 보관 의무.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제29조·안전조치기준 고시 제8조");
        }
        if ("yes".equals(accessLog)) {
            return spec("A-08", "접속기록 미보관", "접속기록을 보관하고 있습니다. 최소 6개월 이상 유지하세요.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제29조·안전조치기준 고시 제8조");
        }
        return spec("A-08", "접속기록 미보관", "접속기록 보관 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제29조·안전조치기준 고시 제8조");
    }

    private DiagnosisSpec diagnoseA13(CompanyProfile profile) {
        List<String> items = ProfileDto.splitCsv(profile.getPersonalDataItems());
        boolean collectsJumin = items.stream().anyMatch(i -> i.contains("주민등록번호"));
        if (!collectsJumin) {
            return spec("A-13", "주민번호 처리 근거", "주민등록번호를 수집하지 않아 처리 근거 규정이 적용되지 않습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제24조의2");
        }
        String ground = profile.getJuminCollectionGround();
        if ("consent".equals(ground) || "unknown".equals(ground)) {
            return spec("A-13", "주민번호 처리 근거", "주민등록번호 수집은 법령에 근거해야 합니다. 동의만으로는 수집할 수 없습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제24조의2");
        }
        if ("law".equals(ground)) {
            return spec("A-13", "주민번호 처리 근거", "법령에 근거하여 주민등록번호를 수집하고 있습니다. 근거 법령을 처리방침에 명시하세요.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제24조의2");
        }
        return spec("A-13", "주민번호 처리 근거", "주민번호 수집 법적 근거를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제24조의2");
    }

    private DiagnosisSpec diagnoseA16(CompanyProfile profile) {
        if ("no".equals(profile.getProvisionStatus())) {
            return spec("A-16", "제3자 제공 동의 의무", "개인정보를 제3자에게 제공하지 않아 동의 의무가 없습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제17조");
        }
        String consent = profile.getProvisionConsentStatus();
        if ("no".equals(consent)) {
            return spec("A-16", "제3자 제공 동의 의무", "개인정보를 제3자에게 제공하고 있으나 정보주체 동의를 받지 않았습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제17조");
        }
        if ("yes".equals(consent)) {
            return spec("A-16", "제3자 제공 동의 의무", "제3자 제공에 대한 동의를 받고 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제17조");
        }
        return spec("A-16", "제3자 제공 동의 의무", "제3자 제공 동의 절차를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제17조");
    }

    private DiagnosisSpec diagnoseA19(CompanyProfile profile) {
        boolean isSmallBiz = profile.getEmployeeCount() != null && profile.getEmployeeCount() <= 4;
        if (isSmallBiz) {
            return spec("A-19", "내부관리계획 수립 의무", "소상공인(직원 4명 이하)은 내부관리계획 수립 의무가 면제됩니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제29조·안전조치기준 고시 제4조");
        }
        String planStatus = profile.getInternalPlanStatus();
        if (!isBlank(profile.getSystemStatus()) && "no".equals(planStatus)) {
            return spec("A-19", "내부관리계획 수립 의무", "개인정보처리시스템을 운영하고 있으나 내부관리계획이 수립되어 있지 않습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제29조·안전조치기준 고시 제4조");
        }
        if ("yes".equals(planStatus) && !isBlank(profile.getInternalPlanCycle())) {
            return spec("A-19", "내부관리계획 수립 의무", "내부관리계획이 수립되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제29조·안전조치기준 고시 제4조");
        }
        return spec("A-19", "내부관리계획 수립 의무", "내부관리계획 수립 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제29조·안전조치기준 고시 제4조");
    }

    private DiagnosisSpec diagnoseA21(CompanyProfile profile) {
        if (!"yes".equals(profile.getCctvOperationStatus())) {
            return spec("A-21", "CCTV 촬영 범위 위반", "CCTV를 운영하지 않습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제25조①");
        }
        String range = profile.getCctvRange();
        if (!isBlank(range) && range.contains("private")) {
            return spec("A-21", "CCTV 촬영 범위 위반", "화장실·탈의실 등 사생활 침해 구역을 촬영하고 있습니다. 형사처벌 대상.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제25조①");
        }
        if (!isBlank(range) && range.contains("adjacent")) {
            return spec("A-21", "CCTV 촬영 범위 위반", "인접 공간이 촬영 범위에 포함될 수 있어 확인이 필요합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제25조①");
        }
        return spec("A-21", "CCTV 촬영 범위 위반", "CCTV 촬영 범위가 적정한 것으로 보입니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제25조①");
    }

    private DiagnosisSpec diagnoseA22(CompanyProfile profile) {
        if ("no".equals(profile.getMarketingStatus())) {
            return spec("A-22", "야간 마케팅 발송", "마케팅 발송을 하지 않아 야간 발송 제한이 적용되지 않습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "정보통신망법 제50조의8");
        }
        String nightSend = profile.getMarketingNightSend();
        if ("yes".equals(nightSend)) {
            return spec("A-22", "야간 마케팅 발송", "야간(오후 9시~오전 8시) 마케팅 메시지를 별도 동의 없이 발송하고 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "정보통신망법 제50조의8");
        }
        if ("no".equals(nightSend)) {
            return spec("A-22", "야간 마케팅 발송", "야간 마케팅 발송을 하지 않습니다.", RiskChecklistItem.RiskLevel.GOOD, "정보통신망법 제50조의8");
        }
        return spec("A-22", "야간 마케팅 발송", "야간 마케팅 발송 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "정보통신망법 제50조의8");
    }

    private int countOccurrences(String text, String target) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(target, idx)) != -1) {
            count++;
            idx += target.length();
        }
        return count;
    }

    // ── A 섹션 — Phase 2 (기존 필드만) ──────────────────────────────────────────

    private DiagnosisSpec diagnoseA09(CompanyProfile profile) {
        List<String> items = ProfileDto.splitCsv(profile.getPersonalDataItems());
        List<String> purposes = ProfileDto.splitCsv(profile.getCollectionPurposes());
        if (items.isEmpty() || purposes.isEmpty()) {
            return spec("A-09", "수집 항목 vs 이용 목적", "수집 항목과 이용 목적을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제16조①");
        }
        boolean hasSensitiveItems = items.stream().anyMatch(i -> i.contains("직업") || i.contains("소속") || i.contains("생년월일"));
        boolean hasMarketingPurpose = purposes.stream().anyMatch(p -> p.contains("마케팅") || p.contains("광고") || p.contains("홍보"));
        if (hasSensitiveItems && !hasMarketingPurpose) {
            return spec("A-09", "수집 항목 vs 이용 목적", "직업·소속·생년월일 등의 정보를 수집하지만 이용 목적에 마케팅이 포함되어 있지 않습니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제16조①");
        }
        return spec("A-09", "수집 항목 vs 이용 목적", "수집 항목과 이용 목적이 일치하는 것으로 보입니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제16조①");
    }

    private DiagnosisSpec diagnoseA11(CompanyProfile profile) {
        List<String> purposes = ProfileDto.splitCsv(profile.getCollectionPurposes());
        if (purposes.isEmpty()) {
            return spec("A-11", "이용 목적 vs 마케팅 발송", "수집 목적을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제15조①");
        }
        boolean hasMarketingPurpose = purposes.stream().anyMatch(p -> p.contains("마케팅") || p.contains("광고") || p.contains("홍보"));
        if (!hasMarketingPurpose && "yes".equals(profile.getMarketingStatus())) {
            return spec("A-11", "이용 목적 vs 마케팅 발송", "마케팅을 발송하고 있으나 수집 목적에 마케팅이 포함되어 있지 않습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제15조①");
        }
        if (!hasMarketingPurpose) {
            return spec("A-11", "이용 목적 vs 마케팅 발송", "수집 목적에 마케팅이 없습니다. 마케팅 발송 여부와 동의 절차를 확인하세요.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제15조①");
        }
        return spec("A-11", "이용 목적 vs 마케팅 발송", "수집 목적에 마케팅이 명시되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제15조①");
    }

    private DiagnosisSpec diagnoseA14(CompanyProfile profile) {
        boolean hasSensitive = !isBlank(profile.getSensitiveDataTypes());
        List<String> items = ProfileDto.splitCsv(profile.getPersonalDataItems());
        boolean hasUniqueId = items.stream().anyMatch(i ->
                i.contains("주민등록번호") || i.contains("여권번호") || i.contains("운전면허번호") || i.contains("외국인등록번호"));
        if (hasSensitive || hasUniqueId) {
            return spec("A-14", "민감정보·고유식별정보 처리", "민감정보 또는 고유식별정보를 처리하고 있어 적법한 근거와 별도 안전조치를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제23조·제24조");
        }
        return spec("A-14", "민감정보·고유식별정보 처리", "민감정보·고유식별정보 수집이 확인되지 않습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제23조·제24조");
    }

    private DiagnosisSpec diagnoseA17(CompanyProfile profile) {
        List<String> delegatees = ProfileDto.splitCsv(profile.getDelegateeTypes());
        boolean usesCloud = delegatees.stream().anyMatch(d -> d.contains("클라우드"));
        String overseasStatus = profile.getOverseasTransferStatus();
        if (usesCloud && "no".equals(overseasStatus)) {
            return spec("A-17", "국외 이전 vs 클라우드 모순", "클라우드 서비스에 위탁하고 있으나 국외 이전이 없다고 응답했습니다. 서버 소재지를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제28조의8");
        }
        if (isBlank(profile.getDelegateeTypes()) || isBlank(overseasStatus)) {
            return spec("A-17", "국외 이전 vs 클라우드 모순", "클라우드 사용 여부와 국외 이전 현황을 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제28조의8");
        }
        return spec("A-17", "국외 이전 vs 클라우드 모순", "클라우드 사용과 국외 이전 현황에 모순이 없습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제28조의8");
    }

    private DiagnosisSpec diagnoseA20(CompanyProfile profile) {
        String sys = profile.getSystemStatus();
        boolean paperOnly = !isBlank(sys) && (sys.contains("종이") || sys.contains("엑셀"))
                && !sys.contains("시스템") && !sys.contains("앱") && !sys.contains("홈페이지");
        if (paperOnly) {
            return spec("A-20", "암호화 처리 의무 위반", "종이·엑셀 기반으로만 처리하여 암호화 의무 적용 대상이 아닙니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제29조·안전조치기준 고시 제7조");
        }
        String encryption = profile.getEncryptionStatus();
        List<String> items = ProfileDto.splitCsv(profile.getPersonalDataItems());
        boolean hasMandatoryItems = items.stream().anyMatch(i -> i.contains("주민등록번호") || i.contains("신용카드") || i.contains("계좌번호"));
        if ("암호화 안 함".equals(encryption) && hasMandatoryItems) {
            return spec("A-20", "암호화 처리 의무 위반", "주민등록번호·신용카드번호 등 필수 암호화 대상 정보를 암호화하지 않고 있습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제29조·안전조치기준 고시 제7조");
        }
        if ("암호화 안 함".equals(encryption)) {
            return spec("A-20", "암호화 처리 의무 위반", "암호화 조치가 적용되지 않고 있습니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제29조·안전조치기준 고시 제7조");
        }
        if (isBlank(encryption)) {
            return spec("A-20", "암호화 처리 의무 위반", "암호화 적용 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제29조·안전조치기준 고시 제7조");
        }
        return spec("A-20", "암호화 처리 의무 위반", "암호화 조치가 적용되어 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제29조·안전조치기준 고시 제7조");
    }

    private DiagnosisSpec diagnoseA25(CompanyProfile profile) {
        if (!"yes".equals(profile.getDelegationStatus())) {
            return spec("A-25", "위탁 사실 공개 의무", "개인정보 처리를 위탁하지 않아 공개 의무가 없습니다.", RiskChecklistItem.RiskLevel.EXEMPT, "개인정보보호법 제26조②");
        }
        if (Boolean.FALSE.equals(profile.getHasPrivacyPolicy())) {
            return spec("A-25", "위탁 사실 공개 의무", "위탁을 하고 있으나 개인정보처리방침이 없어 수탁자 정보를 공개할 수단이 없습니다.", RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제26조②");
        }
        if (profile.getHasPrivacyPolicy() == null) {
            return spec("A-25", "위탁 사실 공개 의무", "위탁 사실 공개 여부를 확인해야 합니다.", RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제26조②");
        }
        return spec("A-25", "위탁 사실 공개 의무", "처리방침에 위탁 사실을 공개하고 있습니다.", RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제26조②");
    }

    private DiagnosisSpec spec(String code, String title, String description, RiskChecklistItem.RiskLevel level, String law) {
        return new DiagnosisSpec(code, title, description, level, law);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record DiagnosisSpec(String code, String title, String description, RiskChecklistItem.RiskLevel level, String relatedLaw) {}
}
