package com.example.pos.controller;

import com.example.pos.entity.Brand;
import com.example.pos.repository.BrandRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
@CrossOrigin(origins = "http://localhost:4200")
public class BrandController {

    private final BrandRepository brandRepository;

    public BrandController(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @GetMapping
    public List<Brand> getAll() {
        return brandRepository.findAll();
    }

    @PostMapping
    public Brand create(@RequestBody Brand brand) {
        return brandRepository.save(brand);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Brand> update(@PathVariable Long id, @RequestBody Brand brand) {
        return brandRepository.findById(id)
                .map(existing -> {
                    existing.setName(brand.getName());
                    existing.setOrigin(brand.getOrigin());
                    existing.setStatus(brand.getStatus());
                    return ResponseEntity.ok(brandRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!brandRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        brandRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

