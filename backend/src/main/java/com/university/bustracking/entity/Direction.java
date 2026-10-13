package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Direction {
    OUTBOUND("OUTBOUND"),
    RETURN("RETURN");

    private final String value;

    Direction(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Direction fromValue(String value) {
        if (value == null) return OUTBOUND;
        for (Direction d : Direction.values()) {
            if (d.value.equalsIgnoreCase(value) || d.name().equalsIgnoreCase(value)) {
                return d;
            }
        }
        return OUTBOUND;
    }
}
