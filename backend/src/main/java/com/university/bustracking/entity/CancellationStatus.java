package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CancellationStatus {
    NONE("None"),
    PENDING("Pending"),
    REJECTED("Rejected"),
    APPROVED("Approved");

    private final String value;

    CancellationStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static CancellationStatus fromValue(String value) {
        if (value == null) return NONE;
        for (CancellationStatus s : CancellationStatus.values()) {
            if (s.value.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        return NONE;
    }
}
