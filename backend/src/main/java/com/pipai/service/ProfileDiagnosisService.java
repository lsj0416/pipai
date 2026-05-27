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
        if (spec.level() != RiskChecklistItem.RiskLevel.GOOD && item.isResolved()) {
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
                diagnoseB11(profile)
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

    private DiagnosisSpec spec(String code, String title, String description, RiskChecklistItem.RiskLevel level, String law) {
        return new DiagnosisSpec(code, title, description, level, law);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record DiagnosisSpec(String code, String title, String description, RiskChecklistItem.RiskLevel level, String relatedLaw) {}
}
