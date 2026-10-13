package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ScheduleStatus {
    ACTIVE("Active"),
    INACTIVE("Inactive");

    private final String value;

    ScheduleStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ScheduleStatus fromValue(String value) {
        if (value == null) return ACTIVE;
        for (ScheduleStatus s : ScheduleStatus.values()) {
            if (s.value.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        return ACTIVE;
    }
}
