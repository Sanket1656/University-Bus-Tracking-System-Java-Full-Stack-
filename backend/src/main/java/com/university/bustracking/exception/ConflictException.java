package com.university.bustracking.exception;

public class ConflictException extends RuntimeException {
    private String code;

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, String code) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

