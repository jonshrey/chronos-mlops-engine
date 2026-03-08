package com.example.chronos;
public class ChronosPipeline {
    public static void main(String[] args) throws Exception {
        System.out.println("Starting Chronos MLOps Pipeline...");
       
        // Initialize our components
        WriteAheadLog producerWal = new WriteAheadLog("chronos-live.log");
        LogConsumer consumerWal = new LogConsumer("chronos-live.log");
        FraudDetector aiModel = new FraudDetector();
       
        int messagesToSimulate = 5_000_000; // 5 Million real-time events
        byte[] dummyTransaction = new byte[64]; // 64-byte transaction payload
       
        // We put some random data in the transaction so the ML model has something to score
        dummyTransaction[0] = (byte) 150;
        dummyTransaction[1] = (byte) 200;

        // =================================================================
        // THREAD 1: THE PRODUCER (Ingesting traffic from the internet)
        // =================================================================
        Thread producerThread = new Thread(() -> {
            for (int i = 0; i < messagesToSimulate; i++) {
                producerWal.append(dummyTransaction);
               
                // We add a tiny micro-sleep to simulate realistic network traffic
                // rather than blasting it all instantly
                if (i % 10000 == 0) {
                    Thread.yield();
                }
            }
            System.out.println("Producer: Ingested all " + messagesToSimulate + " events.");
        });

        // =================================================================
        // THREAD 2: THE CONSUMER + ML INFERENCE (Scoring traffic instantly)
        // =================================================================
        Thread consumerThread = new Thread(() -> {
            int eventsProcessed = 0;
            int fraudDetected = 0;
           
            long startTime = System.currentTimeMillis();

            while (eventsProcessed < messagesToSimulate) {
                byte[] message = consumerWal.readNext();
               
                if (message != null) {
                    // 💥 THE MAGIC: Instantly pass the data to the ML Model
                    boolean isFraud = aiModel.isFraudulent(message);
                   
                    if (isFraud) {
                        fraudDetected++;
                    }
                    eventsProcessed++;
                } else {
                    // If the consumer is reading faster than the producer writes, wait a nanosecond
                    Thread.yield();
                }
            }
           
            long endTime = System.currentTimeMillis();
            long durationMs = endTime - startTime;
           
            System.out.println("====================================");
            System.out.println("MLOps Pipeline Complete!");
            System.out.println("Events Scored: " + eventsProcessed);
            System.out.println("Fraud Anomalies Detected: " + fraudDetected);
            System.out.println("Total Pipeline Time: " + durationMs + " ms");
            System.out.printf("Real-Time Inference Rate: %,.2f scores/second\n",
                             (eventsProcessed / (double)durationMs) * 1000);
            System.out.println("====================================");
        });

        // Start the real-time simulation!
        producerThread.start();
        consumerThread.start();

        // Wait for both to finish
        producerThread.join();
        consumerThread.join();
       
        producerWal.close();
        consumerWal.close();
    }
}