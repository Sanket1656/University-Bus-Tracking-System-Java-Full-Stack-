package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BusStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    MAINTENANCE("maintenance");

    private final String value;

    BusStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static BusStatus fromValue(String value) {
        if (value == null) return ACTIVE;
        for (BusStatus s : BusStatus.values()) {
            if (s.value.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        return ACTIVE;
    }
}
