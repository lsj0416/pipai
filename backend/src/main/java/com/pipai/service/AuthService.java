package com.pipai.service;

import com.pipai.common.JwtProvider;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.domain.User;
import com.pipai.repository.RiskRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RiskRepository riskRepository;

    public record SignupResult(String userId, String email, String name) {}
    public record LoginResult(String accessToken, String refreshToken, long expiresIn) {}

    private record DefaultRisk(String title, String description, RiskChecklistItem.RiskLevel level, String relatedLaw) {}

    private static final List<DefaultRisk> DEFAULT_RISKS = List.of(
            new DefaultRisk("개인정보처리방침 수립 및 공개",
                    "개인정보보호법 제30조에 따라 개인정보처리방침을 작성하고 공개해야 합니다.",
                    RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제30조"),
            new DefaultRisk("개인정보 수집·이용 동의 절차",
                    "개인정보 수집 시 정보주체에게 목적·항목·보유기간을 고지하고 동의를 받아야 합니다.",
                    RiskChecklistItem.RiskLevel.IMMEDIATE, "개인정보보호법 제15조"),
            new DefaultRisk("개인정보 안전성 확보조치",
                    "비밀번호 암호화, 접근 통제, 접속 기록 보관 등 기술적·관리적 보호조치가 필요합니다.",
                    RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제29조"),
            new DefaultRisk("개인정보 파기 절차 수립",
                    "보유기간이 경과하거나 목적이 달성된 개인정보는 지체 없이 파기해야 합니다.",
                    RiskChecklistItem.RiskLevel.CHECK_NEEDED, "개인정보보호법 제21조"),
            new DefaultRisk("제3자 제공 동의 절차",
                    "개인정보를 제3자에게 제공하는 경우 별도 동의를 받아야 합니다.",
                    RiskChecklistItem.RiskLevel.GOOD, "개인정보보호법 제17조")
    );

    @Transactional
    public SignupResult signup(String email, String password, String name,
                               String title, String contactPhone,
                               boolean termsService, boolean termsPrivacy,
                               boolean termsMarketing, boolean termsAiUsage) {
        if (!termsService || !termsPrivacy) {
            throw new IllegalArgumentException("필수 약관에 동의해야 합니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = User.create(email, passwordEncoder.encode(password), name,
                title, contactPhone, termsService, termsPrivacy, termsMarketing, termsAiUsage);
        userRepository.save(user);
        DEFAULT_RISKS.forEach(r ->
                riskRepository.save(RiskChecklistItem.create(user, r.title(), r.description(), r.level(), r.relatedLaw()))
        );
        return new SignupResult(user.getId().toString(), user.getEmail(), user.getName());
    }

    @Transactional(readOnly = true)
    public LoginResult login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return new LoginResult(
                jwtProvider.createAccessToken(user.getId()),
                jwtProvider.createRefreshToken(user.getId()),
                3600L
        );
    }

    @Transactional(readOnly = true)
    public LoginResult refresh(String refreshToken) {
        if (!jwtProvider.validate(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }
        var userId = jwtProvider.getUserId(refreshToken);
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new LoginResult(
                jwtProvider.createAccessToken(userId),
                jwtProvider.createRefreshToken(userId),
                3600L
        );
    }
}
