package com.pipai.service;

import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.Conversation;
import com.pipai.domain.Message;
import com.pipai.domain.User;
import com.pipai.rag.RagPipeline;
import com.pipai.repository.ConversationRepository;
import com.pipai.repository.MessageRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RagPipeline ragPipeline;

    @Transactional(readOnly = true)
    public List<Conversation> listConversations(UUID userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public Conversation createConversation(UUID userId, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return conversationRepository.save(Conversation.create(user, title));
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        if (!conv.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public Flux<String> sendMessage(UUID conversationId, UUID userId, String userMessage) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        if (!conv.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }

        messageRepository.save(Message.ofUser(conv, userMessage));

        return ragPipeline.generateAnswer(userMessage, userId)
                .doOnComplete(() -> {
                    // 스트리밍 완료 후 메시지 저장은 별도 처리
                });
    }
}
