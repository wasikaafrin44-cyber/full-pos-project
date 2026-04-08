package com.example.pos.controller;

import com.example.pos.entity.Order;
import com.example.pos.repository.OrderRepository;
import com.example.pos.service.SaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    private final OrderRepository orderRepository;
    private final SaleService saleService;

    public OrderController(OrderRepository orderRepository, SaleService saleService) {
        this.orderRepository = orderRepository;
        this.saleService = saleService;
    }

    @GetMapping
    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    @PostMapping
    public Order create(@RequestBody Order order) {
        return saleService.createSale(order);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        try {
            return ResponseEntity.ok(saleService.updateStatus(id, request.getStatus()));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        }
    }

    public static class StatusRequest {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
