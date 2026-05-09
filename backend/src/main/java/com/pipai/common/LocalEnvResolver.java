package com.pipai.common;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Slf4j
public final class LocalEnvResolver {

    private static final List<Path> CANDIDATES = List.of(
            Path.of(".env"),
            Path.of("backend", ".env")
    );

    private LocalEnvResolver() {
    }

    public static String preferLocalFile(String key, String configuredValue, boolean localProfile) {
        String normalizedConfigured = normalize(configuredValue);
        if (!localProfile) {
            return normalizedConfigured;
        }

        String fileValue = readFromFile(key);
        if (!fileValue.isBlank()) {
            if (!fileValue.equals(normalizedConfigured)) {
                log.info("Using {} from local .env file", key);
            }
            return fileValue;
        }
        return normalizedConfigured;
    }

    private static String readFromFile(String key) {
        for (Path path : CANDIDATES) {
            if (!Files.exists(path)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(path)) {
                    String trimmed = line.trim();
                    if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.startsWith(key + "=")) {
                        continue;
                    }
                    return normalize(trimmed.substring(key.length() + 1));
                }
            } catch (IOException e) {
                log.warn("Failed to read {}", path, e);
            }
        }
        return "";
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
