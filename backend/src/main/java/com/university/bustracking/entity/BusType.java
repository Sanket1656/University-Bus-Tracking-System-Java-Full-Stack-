package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BusType {
    AC("Ac"),
    NON_AC("Non-Ac");

    private final String value;

    BusType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static BusType fromValue(String value) {
        if (value == null) return NON_AC;
        for (BusType b : BusType.values()) {
            if (b.value.equalsIgnoreCase(value) || b.name().equalsIgnoreCase(value.replace("-", "_"))) {
                return b;
            }
        }
        return NON_AC;
    }
}
