package com.example.pos.controller;

import com.example.pos.entity.Order;
import com.example.pos.repository.OrderRepository;
import com.example.pos.repository.ProductRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public DashboardController(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary(@RequestParam(required = false) String date) {
        LocalDate day = date == null || date.isBlank() ? LocalDate.now() : LocalDate.parse(date);

        Double totalSales = orderRepository.sumCompletedAmountForDate(day);
        if (totalSales == null) {
            totalSales = 0.0;
        }

        long productTypes = productRepository.countDistinctCategories();
        long lowStockCount = productRepository.countByStockLessThanEqual(LOW_STOCK_THRESHOLD);
        long customersToday = orderRepository.countDistinctCustomersForDate(day);

        List<Order> recent = orderRepository.findTop5ByStatusOrderByIdDesc("Completed");

        Map<String, Object> body = new HashMap<>();
        body.put("totalSalesToday", totalSales);
        body.put("productTypesCount", productTypes);
        body.put("lowStockAlertCount", lowStockCount);
        body.put("customersPurchasedToday", customersToday);
        body.put("lowStockThreshold", LOW_STOCK_THRESHOLD);
        body.put("recentSales", recent.stream().map(this::toRecent).collect(Collectors.toList()));

        return body;
    }

    private Map<String, Object> toRecent(Order o) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("customerName", o.getCustomerName());
        m.put("date", o.getDate());
        m.put("total", o.getFinalTotal() != null ? o.getFinalTotal() : o.getTotal());
        m.put("status", o.getStatus());
        return m;
    }
}
