package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.Conversation;
import com.pipai.domain.Message;
import com.pipai.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

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
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SendMessageRequest req) {
        return chatService.sendMessage(id, userId, req.message());
    }
}
