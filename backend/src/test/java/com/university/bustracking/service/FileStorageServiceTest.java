package com.university.bustracking.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "baseUploadDir", tempUploadDir.toString());
        ReflectionTestUtils.setField(fileStorageService, "mediaBaseUrl", "");
    }

    @Test
    void testStoreFile_NullOrEmpty_ReturnsNull() {
        assertNull(fileStorageService.storeFile(null, "test"));

        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);
        assertNull(fileStorageService.storeFile(emptyFile, "test"));
    }

    @Test
    void testStoreFile_DefaultRelativePath() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "bus.png", "image/png", "sample content".getBytes()
        );

        String result = fileStorageService.storeFile(file, "bus");

        assertNotNull(result);
        assertTrue(result.startsWith("/uploads/bus/"), "Should start with relative /uploads/bus/ path");
        assertTrue(result.endsWith(".png"), "Should preserve file extension");
        assertFalse(result.contains("localhost"), "Should not contain hardcoded localhost");
    }

    @Test
    void testStoreFile_WithConfiguredMediaBaseUrl() {
        ReflectionTestUtils.setField(fileStorageService, "mediaBaseUrl", "https://cdn.university.edu");

        MockMultipartFile file = new MockMultipartFile(
                "file", "profile.jpg", "image/jpeg", "image bytes".getBytes()
        );

        String result = fileStorageService.storeFile(file, "student/profile");

        assertNotNull(result);
        assertTrue(result.startsWith("https://cdn.university.edu/uploads/student/profile/"),
                "Should prefix configured CDN URL without double slashes");
        assertTrue(result.endsWith(".jpg"));
    }

    @Test
    void testStoreFile_WithTrailingSlashInMediaBaseUrl_NormalizedCleanly() {
        ReflectionTestUtils.setField(fileStorageService, "mediaBaseUrl", "https://cdn.university.edu/");

        MockMultipartFile file = new MockMultipartFile(
                "file", "driver.webp", "image/webp", "driver photo".getBytes()
        );

        String result = fileStorageService.storeFile(file, "driver/profile");

        assertNotNull(result);
        assertTrue(result.startsWith("https://cdn.university.edu/uploads/driver/profile/"),
                "Should strip trailing slash from base URL to avoid double slash");
        assertFalse(result.contains(".edu//uploads"));
    }
}
