package com.example.chronos;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inference")
public class ChronosController {

    private final ChronosService chronosService;

    public ChronosController(ChronosService chronosService) {
        this.chronosService = chronosService;
    }

    // A simple DTO (Data Transfer Object) to map the incoming JSON
    public static class TransactionRequest {
        public double[] features;
    }

    @PostMapping("/score")
    public ResponseEntity<String> scoreTransaction(@RequestBody TransactionRequest request) {
        try {
            // Drop the data into our ultra-fast memory-mapped pipeline
            chronosService.ingestTransaction(request.features);
           
            // We immediately return "Accepted" so the user isn't kept waiting.
            // The background thread handles the actual ML math in microseconds.
            return ResponseEntity.accepted().body("Transaction ingested into Chronos WAL.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
