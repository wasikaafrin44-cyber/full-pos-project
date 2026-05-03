package com.example.pos.controller;

import com.example.pos.entity.Product;
import com.example.pos.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product create(@RequestBody Product product) {
        product.setId(null);
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product product) {
        return productRepository.findById(id)
                .map(existing -> {
                    existing.setName(product.getName());
                    existing.setCategoryId(product.getCategoryId());
                    existing.setBrandId(product.getBrandId());
                    existing.setPrice(product.getPrice());
                    existing.setStock(product.getStock());
                    existing.setImage(product.getImage());
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/adjust-stock")
    public ResponseEntity<Product> adjustStock(@PathVariable Long id, @RequestBody StockAdjustmentRequest request) {
        return productRepository.findById(id)
                .map(existing -> {
                    Integer current = existing.getStock() == null ? 0 : existing.getStock();
                    existing.setStock(current + request.getDelta());
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public static class StockAdjustmentRequest {
        private int delta;

        public int getDelta() {
            return delta;
        }

        public void setDelta(int delta) {
            this.delta = delta;
        }
    }
}

