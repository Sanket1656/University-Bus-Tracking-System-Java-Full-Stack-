package com.university.bustracking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "route_stops", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"route_id", "stop_order"}),
    @UniqueConstraint(columnNames = {"route_id", "stop_id"})
})
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private BusRoute route;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stop_id", nullable = false)
    private BusStop stop;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    public RouteStop() {}

    public RouteStop(BusRoute route, BusStop stop, Integer stopOrder) {
        this.route = route;
        this.stop = stop;
        this.stopOrder = stopOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BusRoute getRoute() {
        return route;
    }

    public void setRoute(BusRoute route) {
        this.route = route;
    }

    public BusStop getStop() {
        return stop;
    }

    public void setStop(BusStop stop) {
        this.stop = stop;
    }

    @JsonProperty("order")
    public Integer getStopOrder() {
        return stopOrder;
    }

    public void setStopOrder(Integer stopOrder) {
        this.stopOrder = stopOrder;
    }
}
