package com.example.pos.controller;

import com.example.pos.entity.Customer;
import com.example.pos.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<Customer> getAll() {
        return customerRepository.findAll();
    }

    @PostMapping
    public Customer create(@RequestBody Customer customer) {
        customer.setId(null);
        return customerRepository.save(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(@PathVariable Long id, @RequestBody Customer customer) {
        return customerRepository.findById(id)
                .map(existing -> {
                    existing.setName(customer.getName());
                    existing.setEmail(customer.getEmail());
                    existing.setPhone(customer.getPhone());
                    existing.setType(customer.getType());
                    existing.setJoinDate(customer.getJoinDate());
                    existing.setLoyaltyPoints(customer.getLoyaltyPoints());
                    return ResponseEntity.ok(customerRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

