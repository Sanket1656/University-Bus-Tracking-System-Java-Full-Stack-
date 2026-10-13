package com.university.bustracking.dto;

public class DependencyItemDto {
    private String type;
    private long count;
    private String message;

    public DependencyItemDto() {}

    public DependencyItemDto(String type, long count, String message) {
        this.type = type;
        this.count = count;
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
