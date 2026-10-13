package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bus_locations")
public class BusLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_id", nullable = false, unique = true)
    private Bus bus;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double speed = 0.0;
    private Double heading = 0.0;
    private Boolean isMoving = false;
    private Integer currentStopIndex;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_stop_id")
    private BusStop currentStop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "next_stop_id")
    private BusStop nextStop;

    private Double routeProgress = 0.0;
    private Boolean routeCompleted = false;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BusLocation() {}

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

    public Bus getBus() {
        return bus;
    }

    public void setBus(Bus bus) {
        this.bus = bus;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    // Support legacy misspelling
    @Transient
    @JsonProperty("longtitude")
    public Double getLongtitude() {
        return longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }

    @JsonProperty("isMoving")
    public Boolean getIsMoving() {
        return isMoving;
    }

    public void setIsMoving(Boolean isMoving) {
        this.isMoving = isMoving;
    }

    public Integer getCurrentStopIndex() {
        return currentStopIndex;
    }

    public void setCurrentStopIndex(Integer currentStopIndex) {
        this.currentStopIndex = currentStopIndex;
    }

    public BusStop getCurrentStop() {
        return currentStop;
    }

    public void setCurrentStop(BusStop currentStop) {
        this.currentStop = currentStop;
    }

    @JsonProperty("currentStopId")
    public String getCurrentStopId() {
        return currentStop != null && currentStop.getId() != null ? String.valueOf(currentStop.getId()) : null;
    }

    public BusStop getNextStop() {
        return nextStop;
    }

    public void setNextStop(BusStop nextStop) {
        this.nextStop = nextStop;
    }

    @JsonProperty("nextStopId")
    public String getNextStopId() {
        return nextStop != null && nextStop.getId() != null ? String.valueOf(nextStop.getId()) : null;
    }

    public Double getRouteProgress() {
        return routeProgress;
    }

    public void setRouteProgress(Double routeProgress) {
        this.routeProgress = routeProgress;
    }

    public Boolean getRouteCompleted() {
        return routeCompleted;
    }

    public void setRouteCompleted(Boolean routeCompleted) {
        this.routeCompleted = routeCompleted;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
