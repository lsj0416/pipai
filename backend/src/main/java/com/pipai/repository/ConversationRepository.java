package com.pipai.repository;

import com.pipai.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    @Modifying
    @Transactional
    @Query("UPDATE Conversation c SET c.title = :title WHERE c.id = :id")
    void updateTitle(@Param("id") UUID id, @Param("title") String title);
}
