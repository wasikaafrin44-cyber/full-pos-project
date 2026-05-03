package com.example.pos.controller;

import com.example.pos.entity.Purchase;
import com.example.pos.entity.PurchaseItem;
import com.example.pos.repository.ProductRepository;
import com.example.pos.repository.PurchaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "http://localhost:4200")
public class PurchaseController {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;

    public PurchaseController(PurchaseRepository purchaseRepository, ProductRepository productRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Purchase> getAll() {
        return purchaseRepository.findAll();
    }

    @PostMapping
    @Transactional
    public Purchase create(@RequestBody Purchase purchase) {
        purchase.setId(null);
        if (purchase.getItems() != null) {
            for (PurchaseItem item : purchase.getItems()) {
                item.setPurchase(purchase);
            }
        }
        Purchase saved = purchaseRepository.save(purchase);
        applyStockIncrease(saved.getItems());
        return saved;
    }

    private void applyStockIncrease(List<PurchaseItem> items) {
        if (items == null) return;

        for (PurchaseItem item : items) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;

            productRepository.findById(item.getProductId()).ifPresent(p -> {
                // ✅ Fix stock
                int current = p.getStock() == null ? 0 : p.getStock();
                p.setStock(current + item.getQuantity());

                // ✅ Update price
                if (item.getPurchasePrice() != null && item.getPurchasePrice() > 0) {
                    p.setPrice(item.getPurchasePrice());
                }

                productRepository.save(p);
            });
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!purchaseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        purchaseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

