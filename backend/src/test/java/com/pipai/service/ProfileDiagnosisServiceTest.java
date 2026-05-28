package com.pipai.service;

import com.pipai.domain.CompanyProfile;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.domain.User;
import com.pipai.repository.RiskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileDiagnosisServiceTest {

    @Mock
    private RiskRepository riskRepository;

    private ProfileDiagnosisService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new ProfileDiagnosisService(riskRepository);
        user = User.create("test@example.com", "pw", "Tester", null, null, true, true, false, false);
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        when(riskRepository.save(any(RiskChecklistItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void rediagnose_createsAllHighOrCheckNeededRisksForBadProfile() {
        CompanyProfile profile = CompanyProfile.create(user);
        profile.update(
                null, null, null, null, null, null, null,
                "정보통신업", null, 12, "10억 ~ 30억원 미만", null,
                null, "성명,연락처(전화번호)", false, "건강·의료정보", null,
                "오프라인 서면 작성,이메일·메신저", "채용·인사 관리", null,
                "yes", "클라우드 서비스 (AWS, GCP 등)", "no", null,
                "yes", "보유함 (CRM, ERP, 회원관리 시스템 등)", "암호화 안 함",
                "별도 파기 절차 없음", "별도 방법 없음",
                "별도 관리 없음", "보관 중 (파기 계획 없음)",
                "사내 DB·CRM에 등록함", "계속 보관 중",
                "",
                "공개 안 함", "점검하지 않음", "실시하지 않음",
                "국외 서버 포함 사용", "",
                "그 외 제3자에게 제공함", "별도 관리 없음",
                "암호화 항목 없음", "분리되어 있지 않음 (공용 계정)", "회수하지 않음", "기록하지 않음",
                null, null, null, null, null,
                null, null, null, null, null,
                null, null,
                null, null, null, null,
                null, null,
                null, null, null,
                null, null, null,
                null, null,
                null, null, null,
                null, null
        );

        when(riskRepository.findByUserIdAndSourceTypeAndDiagnosisCode(eq(user.getId()), eq(RiskChecklistItem.SourceType.PROFILE), anyString()))
                .thenReturn(Optional.empty());

        service.rediagnose(user, profile);

        ArgumentCaptor<RiskChecklistItem> captor = ArgumentCaptor.forClass(RiskChecklistItem.class);
        verify(riskRepository, atLeastOnce()).save(captor.capture());

        Map<String, RiskChecklistItem> items = captor.getAllValues().stream()
                .collect(Collectors.toMap(RiskChecklistItem::getDiagnosisCode, Function.identity()));

        assertThat(items).containsKey("B-01");
        assertThat(items.get("B-01").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-03").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-04").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-05").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-06").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-08").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-09").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
        assertThat(items.get("B-10").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.CHECK_NEEDED);
        assertThat(items.get("B-11").getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
    }

    @Test
    void rediagnose_marksAllRisksGoodOrExemptForWellManagedProfile() {
        CompanyProfile profile = CompanyProfile.create(user);
        profile.update(
                null, null, null, null, null, null, null,
                "도매·소매업", null, 8, "0 ~ 10억원 미만", null,
                null, "성명,연락처(전화번호),이메일", true, null, null,
                "회원가입,주문·결제", "서비스 제공 (계약 이행),마케팅·광고 (영리 목적)", null,
                "yes", "클라우드 서비스 (AWS, GCP 등)", "yes", "미국",
                "yes", "보유함 (CRM, ERP, 회원관리 시스템 등)", "암호화 처리함",
                "보유기간을 항목별로 관리하고 있음", "완전파괴 (소각·파쇄)",
                "채용 후 즉시 파기", "퇴직 즉시 파기",
                "등록하지 않음", "거래 종료 즉시 파기",
                "처리 목적·수집 항목·보유기간,제3자 제공 현황 (해당 시),위탁 현황 (해당 시),CPO 성명·연락처,정보주체 권리·행사 방법,자동 수집 장치 설치·운영 (해당 시),파기 절차·방법",
                "처리방침에 수탁자명·업무 내용·위탁 기간 모두 공개", "연 1회 이상 점검 실시", "실시함",
                "국외 서버 포함 사용", "미국",
                "외부에 제공한 적 없음", "담당자만 접근 가능하도록 관리",
                "비밀번호 (해시 처리),주민등록번호,신용카드번호·계좌번호", "직원별로 권한이 분리되어 있음", "퇴직 즉시 회수", "내역을 기록하고 3년간 보관",
                "yes", "대표이사",
                "website", "https://example.com",
                "{\"클라우드 서비스 (AWS, GCP 등)\":\"written\"}",
                "yes", "separate", "no",
                "yes", "public",
                "yes", null,
                "no", null, null, null,
                "yes", "annual",
                null, null, null,
                null, null, null,
                null, null,
                null, null, null,
                null, null
        );

        when(riskRepository.findByUserIdAndSourceTypeAndDiagnosisCode(eq(user.getId()), eq(RiskChecklistItem.SourceType.PROFILE), anyString()))
                .thenReturn(Optional.empty());

        service.rediagnose(user, profile);

        ArgumentCaptor<RiskChecklistItem> captor = ArgumentCaptor.forClass(RiskChecklistItem.class);
        verify(riskRepository, atLeastOnce()).save(captor.capture());

        assertThat(captor.getAllValues())
                .extracting(RiskChecklistItem::getLevel)
                .containsOnly(RiskChecklistItem.RiskLevel.GOOD, RiskChecklistItem.RiskLevel.EXEMPT);
    }

    @Test
    void rediagnose_reopensResolvedProfileRiskWhenItBecomesRiskyAgain() {
        CompanyProfile profile = CompanyProfile.create(user);
        profile.update(
                null, null, null, null, null, null, null,
                "정보통신업", null, 12, "10억 ~ 30억원 미만", null,
                null, "성명,연락처(전화번호)", true, null, null,
                "회원가입", "서비스 제공 (계약 이행)", null,
                "yes", "", "no", null,
                "no", "엑셀·문서로만 관리", "모르겠음",
                "모르겠음", null,
                null, null,
                null, null,
                "",
                "공개 안 함", "모르겠음", "모르겠음",
                "모르겠음", null,
                null, null,
                null, null, null, null,
                null, null, null, null, null,
                null, null, null, null, null,
                null, null,
                null, null, null, null,
                null, null,
                null, null, null,
                null, null, null,
                null, null,
                null, null, null,
                null, null
        );

        RiskChecklistItem existing = RiskChecklistItem.create(
                user, "처리방침 내 수탁자 공개", "old", RiskChecklistItem.RiskLevel.GOOD,
                "개인정보보호법 제26조②", "B-01", RiskChecklistItem.SourceType.PROFILE, null
        );
        existing.resolve();

        when(riskRepository.findByUserIdAndSourceTypeAndDiagnosisCode(eq(user.getId()), eq(RiskChecklistItem.SourceType.PROFILE), anyString()))
                .thenAnswer(invocation -> "B-01".equals(invocation.getArgument(2))
                        ? Optional.of(existing)
                        : Optional.empty());

        service.rediagnose(user, profile);

        assertThat(existing.isResolved()).isFalse();
        assertThat(existing.getResolvedAt()).isNull();
        assertThat(existing.getLevel()).isEqualTo(RiskChecklistItem.RiskLevel.IMMEDIATE);
    }
}
