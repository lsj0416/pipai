package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.common.JwtProvider;
import com.pipai.domain.Conversation;
import com.pipai.domain.Message;
import com.pipai.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final JwtProvider jwtProvider;

    public record CreateConversationRequest(@NotBlank String title) {}
    public record SendMessageRequest(@NotBlank String message) {}

    @GetMapping
    public ApiResponse<List<Conversation>> list(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(chatService.listConversations(userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Conversation> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateConversationRequest req) {
        return ApiResponse.ok(chatService.createConversation(userId, req.title()));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<Message>> messages(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(chatService.getMessages(id, userId));
    }

    @PostMapping(value = "/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest req,
            HttpServletRequest request) {
        // SSE 엔드포인트는 SecurityConfig에서 permitAll 처리됨 — 여기서 직접 JWT 검증
        String bearer = request.getHeader("Authorization");
        if (!StringUtils.hasText(bearer) || !bearer.startsWith("Bearer ")) {
            return Flux.error(new org.springframework.security.access.AccessDeniedException("인증이 필요합니다."));
        }
        String token = bearer.substring(7);
        if (!jwtProvider.validate(token)) {
            return Flux.error(new org.springframework.security.access.AccessDeniedException("유효하지 않은 토큰입니다."));
        }
        UUID userId = jwtProvider.getUserId(token);
        return Flux.defer(() -> chatService.sendMessage(id, userId, req.message()))
                .onErrorResume(e -> Flux.just("data: {\"type\":\"error\",\"content\":\"죄송합니다. AI 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.\"}\n\n"));
    }
}
