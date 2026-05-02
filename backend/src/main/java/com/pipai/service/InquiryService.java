package com.pipai.service;

import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.Conversation;
import com.pipai.domain.InquiryDraft;
import com.pipai.domain.User;
import com.pipai.repository.ConversationRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    @Transactional
    public InquiryDraft generate(UUID userId, UUID conversationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        // TODO: LLM으로 대화 내용을 법적 용어로 구조화
        return InquiryDraft.create(user, conv, "문의 초안", "내용을 입력하세요.", null);
    }
}
