package com.metasysusa.secvault_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/status")
public class ServerStatus {

    @GetMapping
    public String healthCheck() {
        return "Hello from SecVault Backend!";
    }
}
