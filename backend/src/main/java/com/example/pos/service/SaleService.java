package com.example.pos.service;

import com.example.pos.entity.Order;
import com.example.pos.entity.OrderItem;
import com.example.pos.entity.Product;
import com.example.pos.repository.OrderRepository;
import com.example.pos.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SaleService {

    private static final String COMPLETED = "Completed";

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public SaleService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Order createSale(Order order) {
        order.setId(null);
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                item.setOrder(order);
            }
        }

        normalizeTotals(order);

        String status = order.getStatus() == null ? COMPLETED : order.getStatus();
        order.setStatus(status);

        if (COMPLETED.equalsIgnoreCase(status)) {
            applyStockDeduction(order.getItems());
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateStatus(Long id, String newStatus) {
        Order existing = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String previous = existing.getStatus();
        if (newStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status required");
        }

        if (COMPLETED.equalsIgnoreCase(newStatus) && !COMPLETED.equalsIgnoreCase(previous)) {
            applyStockDeduction(existing.getItems());
        }

        existing.setStatus(newStatus);
        return orderRepository.save(existing);
    }

    private void normalizeTotals(Order order) {
        double subtotal = 0;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                double line = (item.getPrice() == null ? 0 : item.getPrice())
                        * (item.getQuantity() == null ? 0 : item.getQuantity());
                subtotal += line;
            }
        }
        if (order.getSubtotal() == null) {
            order.setSubtotal(subtotal);
        }
        double discount = order.getDiscount() == null ? 0 : order.getDiscount();
        double tax = order.getTax() == null ? 0 : order.getTax();
        double finalTotal = order.getFinalTotal() != null
                ? order.getFinalTotal()
                : Math.max(0, (order.getSubtotal() == null ? subtotal : order.getSubtotal()) - discount + tax);
        order.setFinalTotal(finalTotal);
        order.setTotal(finalTotal);
    }

    private void applyStockDeduction(List<OrderItem> items) {
        if (items == null) {
            return;
        }
        for (OrderItem item : items) {
            if (item.getProductId() == null) {
                continue;
            }
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Unknown product id: " + item.getProductId()));
            int qty = item.getQuantity() == null ? 0 : item.getQuantity();
            int current = product.getStock() == null ? 0 : product.getStock();
            if (current < qty) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for " + product.getName());
            }
            product.setStock(current - qty);
            productRepository.save(product);
        }
    }
}
