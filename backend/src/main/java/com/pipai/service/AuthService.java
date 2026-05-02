package com.pipai.service;

import com.pipai.common.JwtProvider;
import com.pipai.domain.User;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public record SignupResult(String userId, String email, String name) {}
    public record LoginResult(String accessToken, String refreshToken, long expiresIn) {}

    @Transactional
    public SignupResult signup(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = User.create(email, passwordEncoder.encode(password), name);
        userRepository.save(user);
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
