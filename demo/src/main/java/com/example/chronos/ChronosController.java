package com.example.chronos;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inference") // Base path
public class ChronosController {

    private final ChronosService chronosService;
    private final OnnxFraudDetector detector; // Added so we can get the score for the UI

    public ChronosController(ChronosService chronosService, OnnxFraudDetector detector) {
        this.chronosService = chronosService;
        this.detector = detector;
    }

    // Your existing DTO
    public static class TransactionRequest {
        public double[] features;
    }

    @PostMapping("/score") // Full path is /api/inference/score
    public ResponseEntity<Map<String, Object>> scoreTransaction(@RequestBody TransactionRequest request) {
        try {
            // 1. Start the high-precision stopwatch
            long startTime = System.nanoTime();

            // 2. Ingest into the WAL (your original ultra-fast async architecture)
            chronosService.ingestTransaction(request.features);
           
            // 3. For the UI Demo: Evaluate the model so we can send the result to React
            boolean isAnomaly = detector.predict(request.features);
            double score = isAnomaly ? 1.0 : 0.0;

            // 4. Stop the stopwatch and convert to microseconds
            long endTime = System.nanoTime();
            long latencyMicros = (endTime - startTime) / 1000;

            // 5. Build the JSON response expected by the Python script
            Map<String, Object> response = new HashMap<>();
            response.put("score", score);
            response.put("latency_micros", latencyMicros);
            response.put("message", "Transaction ingested into Chronos WAL.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}

