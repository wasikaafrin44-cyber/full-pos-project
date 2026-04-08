package com.example.pos.controller;

import com.example.pos.entity.Supplier;
import com.example.pos.repository.SupplierRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "http://localhost:4200")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    public SupplierController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    public List<Supplier> getAll() {
        return supplierRepository.findAll();
    }

    @PostMapping
    public Supplier create(@RequestBody Supplier supplier) {
        supplier.setId(null);
        return supplierRepository.save(supplier);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> update(@PathVariable Long id, @RequestBody Supplier supplier) {
        return supplierRepository.findById(id)
                .map(existing -> {
                    existing.setName(supplier.getName());
                    existing.setContactPerson(supplier.getContactPerson());
                    existing.setEmail(supplier.getEmail());
                    existing.setPhone(supplier.getPhone());
                    existing.setCategory(supplier.getCategory());
                    return ResponseEntity.ok(supplierRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!supplierRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        supplierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

