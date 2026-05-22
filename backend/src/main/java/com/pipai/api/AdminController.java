package com.pipai.api;

import com.pipai.service.DataInitializer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final DataInitializer dataInitializer;

    @Value("${admin.secret:}")
    private String adminSecret;

    @PostMapping("/init-data")
    public ResponseEntity<String> triggerDataInit(
            @RequestHeader(value = "X-Admin-Secret", defaultValue = "") String secret) {
        if (adminSecret.isEmpty() || !adminSecret.equals(secret)) {
            return ResponseEntity.status(403).body("Forbidden");
        }
        log.info("관리자 API를 통한 데이터 초기화 수동 트리거");
        CompletableFuture.runAsync(dataInitializer::initializeData);
        return ResponseEntity.ok("Data initialization triggered (running in background). Check CloudWatch logs.");
    }
}
