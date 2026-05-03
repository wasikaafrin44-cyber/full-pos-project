package com.example.pos.controller;

import com.example.pos.entity.Category;
import com.example.pos.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        return categoryRepository.save(category);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Category category) {
        return categoryRepository.findById(id)
                .map(existing -> {
                    existing.setName(category.getName());
                    existing.setDescription(category.getDescription());
                    existing.setStatus(category.getStatus());
                    return ResponseEntity.ok(categoryRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

