package com.example.chronos;
public class Benchmark {
    public static void main(String[] args) {
        try {
            System.out.println("Initializing Chronos WAL...");
            // This will create a 1GB file on your hard drive called chronos-data.log
            WriteAheadLog wal = new WriteAheadLog("chronos-data.log");
           
            // A simple 100-byte message simulating a JSON payload or transaction
            byte[] dummyMessage = new byte[100];
            int totalMessages = 10_000_000; // 10 Million messages!

            System.out.println("Starting benchmark: Writing 10 Million messages...");
           
            // Start the stopwatch
            long startTime = System.currentTimeMillis();

            // Hammer the Write-Ahead Log as fast as the CPU allows
            for (int i = 0; i < totalMessages; i++) {
                wal.append(dummyMessage);
            }

            // Stop the stopwatch
            long endTime = System.currentTimeMillis();
            long durationMs = endTime - startTime;
           
            // Calculate the metrics
            double messagesPerSecond = (totalMessages / (double) durationMs) * 1000;
           
            System.out.println("====================================");
            System.out.println("Benchmark Complete!");
            System.out.println("Time taken: " + durationMs + " ms");
            System.out.printf("Throughput: %,.2f messages/second\n", messagesPerSecond);
            System.out.println("====================================");

            wal.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}