package com.metasysusa.secvault_backend.dto;

import lombok.Data;

@Data
public class SearchRequestDTO {
    private Long userId;
    private String searchTerm;
}