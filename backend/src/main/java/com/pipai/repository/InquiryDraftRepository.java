package com.pipai.repository;

import com.pipai.domain.InquiryDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InquiryDraftRepository extends JpaRepository<InquiryDraft, UUID> {
    Optional<InquiryDraft> findByConversationId(UUID conversationId);
    List<InquiryDraft> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}
