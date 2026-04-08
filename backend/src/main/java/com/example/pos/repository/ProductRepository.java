package com.example.pos.repository;

import com.example.pos.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT COUNT(DISTINCT p.categoryId) FROM Product p WHERE p.categoryId IS NOT NULL")
    long countDistinctCategories();

    long countByStockLessThanEqual(int threshold);
}

