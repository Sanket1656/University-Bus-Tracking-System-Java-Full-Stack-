package com.university.bustracking.dto;

import java.util.ArrayList;
import java.util.List;

public class ResourceDependencyResponse {
    private boolean success;
    private String code;
    private String message;
    private String resourceType;
    private Long resourceId;
    private String resourceName;
    private boolean canDelete;
    private boolean canDeactivate;
    private List<DependencyItemDto> dependencies = new ArrayList<>();

    public ResourceDependencyResponse() {}

    public ResourceDependencyResponse(boolean success, String code, String message, String resourceType,
                                      Long resourceId, String resourceName, boolean canDelete,
                                      boolean canDeactivate, List<DependencyItemDto> dependencies) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.canDelete = canDelete;
        this.canDeactivate = canDeactivate;
        this.dependencies = dependencies != null ? dependencies : new ArrayList<>();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }

    public boolean isCanDeactivate() {
        return canDeactivate;
    }

    public void setCanDeactivate(boolean canDeactivate) {
        this.canDeactivate = canDeactivate;
    }

    public List<DependencyItemDto> getDependencies() {
        return dependencies;
    }

    public void setDependencies(List<DependencyItemDto> dependencies) {
        this.dependencies = dependencies;
    }
}
