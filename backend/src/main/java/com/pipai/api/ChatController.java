package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.common.JwtProvider;
import com.pipai.domain.Conversation;
import com.pipai.domain.Message;
import com.pipai.repository.MessageRepository;
import com.pipai.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final JwtProvider jwtProvider;
    private final MessageRepository messageRepository;

    public record CreateConversationRequest(@NotBlank String title, String conversationType) {}
    public record SendMessageRequest(@NotBlank String message) {}
    public record ConversationListItem(
            String conversationId,
            String title,
            String lastMessage,
            Instant updatedAt
    ) {}
    public record ConversationData(
            String id,
            String title,
            String conversationType,
            Instant createdAt,
            Instant updatedAt
    ) {}
    public record ConversationMessage(
            String messageId,
            String role,
            String content,
            Instant createdAt
    ) {}
    public record ConversationMessagesData(
            String conversationId,
            List<ConversationMessage> messages
    ) {}

    @GetMapping
    public ApiResponse<List<ConversationListItem>> list(@AuthenticationPrincipal UUID userId) {
        List<ConversationListItem> items = chatService.listConversations(userId).stream()
                .map(this::toConversationListItem)
                .toList();
        return ApiResponse.ok(items);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ConversationData> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateConversationRequest req) {
        return ApiResponse.ok(toConversationData(chatService.createConversation(userId, req.title(), req.conversationType())));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        chatService.deleteConversation(id, userId);
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<ConversationMessagesData> messages(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        List<ConversationMessage> messages = chatService.getMessages(id, userId).stream()
                .map(this::toConversationMessage)
                .toList();
        return ApiResponse.ok(new ConversationMessagesData(id.toString(), messages));
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
        log.info("[DIAG] sendMessage conversationId={} userId={}", id, userId);
        return Flux.defer(() -> chatService.sendMessage(id, userId, req.message()))
                .onErrorResume(e -> Flux.just("{\"type\":\"error\",\"content\":\"죄송합니다. AI 서비스에 일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.\"}"));
    }

    private ConversationListItem toConversationListItem(Conversation conversation) {
        Message lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId());
        return new ConversationListItem(
                conversation.getId().toString(),
                conversation.getTitle(),
                lastMessage != null ? lastMessage.getContent() : "",
                conversation.getUpdatedAt()
        );
    }

    private ConversationData toConversationData(Conversation conversation) {
        return new ConversationData(
                conversation.getId().toString(),
                conversation.getTitle(),
                conversation.getConversationType(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }

    private ConversationMessage toConversationMessage(Message message) {
        return new ConversationMessage(
                message.getId().toString(),
                message.getRole().name().toLowerCase(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
