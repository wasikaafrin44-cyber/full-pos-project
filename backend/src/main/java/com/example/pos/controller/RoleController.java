package com.example.pos.controller;

import com.example.pos.entity.EmployeeRole;
import com.example.pos.repository.EmployeeRoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:4200")
public class RoleController {

    private final EmployeeRoleRepository roleRepository;

    public RoleController(EmployeeRoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    public List<EmployeeRole> getAll() {
        return roleRepository.findAll();
    }

    @PostMapping
    public EmployeeRole create(@RequestBody EmployeeRole role) {
        role.setId(null);
        return roleRepository.save(role);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeRole> update(@PathVariable Long id, @RequestBody EmployeeRole role) {
        return roleRepository.findById(id)
                .map(existing -> {
                    existing.setName(role.getName());
                    existing.setDescription(role.getDescription());
                    existing.setPermissions(role.getPermissions());
                    return ResponseEntity.ok(roleRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!roleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

