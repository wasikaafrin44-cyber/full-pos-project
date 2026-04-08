package com.example.pos.controller;

import com.example.pos.entity.Employee;
import com.example.pos.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:4200")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;

    public EmployeeController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    @PostMapping
    public Employee create(@RequestBody Employee employee) {
        employee.setId(null);
        return employeeRepository.save(employee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee employee) {
        return employeeRepository.findById(id)
                .map(existing -> {
                    existing.setName(employee.getName());
                    existing.setRole(employee.getRole());
                    existing.setOutlet(employee.getOutlet());
                    existing.setEmail(employee.getEmail());
                    return ResponseEntity.ok(employeeRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!employeeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        employeeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

