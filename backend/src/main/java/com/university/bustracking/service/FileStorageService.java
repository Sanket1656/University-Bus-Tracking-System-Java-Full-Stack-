package com.university.bustracking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String baseUploadDir;

    @Value("${app.media.base-url:}")
    private String mediaBaseUrl;

    public String storeFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Path targetDir = Paths.get(baseUploadDir, subFolder);
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFilename = UUID.randomUUID() + extension;
            Path targetPath = targetDir.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/" + subFolder + "/" + uniqueFilename;
            if (mediaBaseUrl != null && !mediaBaseUrl.trim().isEmpty()) {
                String cleanBase = mediaBaseUrl.trim().replaceAll("/+$", "");
                return cleanBase + relativePath;
            }
            return relativePath;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + e.getMessage(), e);
        }
    }
}
