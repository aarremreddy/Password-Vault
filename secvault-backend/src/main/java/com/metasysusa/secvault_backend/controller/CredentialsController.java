package com.metasysusa.secvault_backend.controller;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.dto.SearchRequestDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import com.metasysusa.secvault_backend.service.CredentialsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
public class CredentialsController {

    private final CredentialsService credentialsService;

    public CredentialsController(CredentialsService credentialsService) {
        this.credentialsService = credentialsService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Credentials credentials, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            // Set userId from session
            credentials.setUserId(userId);

            // Validate required fields
            if (credentials.getServiceName() == null || credentials.getServiceName().trim().isEmpty() ||
                credentials.getUrl() == null || credentials.getUrl().trim().isEmpty() ||
                credentials.getUserName() == null || credentials.getUserName().trim().isEmpty() ||
                credentials.getPassword() == null || credentials.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("required fields are missing");
            }

            credentialsService.createCredentials(credentials);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Create failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll(HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            List<CredentialsDTO> all = credentialsService.getByUserId(userId);
            if (all != null && !all.isEmpty()) {
                return new ResponseEntity<>(all, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Get credentials failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @PostMapping("/decrypt-password")
    public ResponseEntity<?> decryptPassword(@RequestBody String encryptedPassword) {
        try {
            String decryptedPassword = credentialsService.decryptPassword(encryptedPassword);
            return ResponseEntity.ok(decryptedPassword);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Decrypt failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchCredentials(@RequestBody SearchRequestDTO searchRequest) {
        try {
            if (searchRequest.getUserId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("userId is required");
            }

            List<CredentialsDTO> results = credentialsService.searchCredentialsByUserId(
                    searchRequest.getUserId(),
                    searchRequest.getSearchTerm()
            );
            if (results != null && !results.isEmpty()) {
                return new ResponseEntity<>(results, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Search failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Credentials credentials) {
        try {
            if (credentials.getUserId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("userId is required");
            }

            Credentials updated = credentialsService.updateCredential(id, credentials);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Update failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            credentialsService.deleteCredential(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Delete failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

}
