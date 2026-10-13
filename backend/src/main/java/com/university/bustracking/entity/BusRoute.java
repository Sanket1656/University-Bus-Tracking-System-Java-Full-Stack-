package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bus_routes")
public class BusRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String routeName;

    @Column(nullable = false, unique = true)
    private String routeCode;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stopOrder ASC")
    private List<RouteStop> routeStops = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleStatus status = ScheduleStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;


    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BusRoute() {}

    public BusRoute(String routeName, String routeCode) {
        this.routeName = routeName;
        this.routeCode = routeCode;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonProperty("_id")
    public String get_id() {
        return id != null ? String.valueOf(id) : null;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getRouteCode() {
        return routeCode;
    }

    public void setRouteCode(String routeCode) {
        this.routeCode = routeCode;
    }

    public List<RouteStop> getRouteStops() {
        return routeStops;
    }

    public void setRouteStops(List<RouteStop> routeStops) {
        this.routeStops = routeStops;
    }

    @JsonProperty("stops")
    public List<RouteStop> getStops() {
        return routeStops;
    }

    @JsonProperty("startStop")
    public BusStop getStartStop() {
        if (routeStops != null && !routeStops.isEmpty()) {
            return routeStops.get(0).getStop();
        }
        return null;
    }

    @JsonProperty("endStop")
    public BusStop getEndStop() {
        if (routeStops != null && !routeStops.isEmpty()) {
            return routeStops.get(routeStops.size() - 1).getStop();
        }
        return null;
    }

    public ScheduleStatus getStatus() {
        return status != null ? status : ScheduleStatus.ACTIVE;
    }

    public void setStatus(ScheduleStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

