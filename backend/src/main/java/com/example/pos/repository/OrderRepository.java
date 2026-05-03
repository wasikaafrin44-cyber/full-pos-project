package com.example.pos.repository;

import com.example.pos.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByDate(LocalDate date);

    @Query("SELECT COALESCE(SUM(o.finalTotal), COALESCE(SUM(o.total), 0)) FROM Order o WHERE o.date = :d AND o.status = 'Completed'")
    Double sumCompletedAmountForDate(@Param("d") LocalDate d);

    @Query("SELECT COUNT(DISTINCT o.customerId) FROM Order o WHERE o.date = :d AND o.status = 'Completed' AND o.customerId IS NOT NULL")
    long countDistinctCustomersForDate(@Param("d") LocalDate d);

    List<Order> findTop5ByStatusOrderByIdDesc(String status);
}

