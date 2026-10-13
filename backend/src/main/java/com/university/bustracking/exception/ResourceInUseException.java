package com.university.bustracking.exception;

import com.university.bustracking.dto.ResourceDependencyResponse;

public class ResourceInUseException extends RuntimeException {
    private final ResourceDependencyResponse response;

    public ResourceInUseException(ResourceDependencyResponse response) {
        super(response != null ? response.getMessage() : "Resource is in use");
        this.response = response;
    }

    public ResourceDependencyResponse getResponse() {
        return response;
    }
}
