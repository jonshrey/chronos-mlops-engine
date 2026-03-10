package com.example.chronos;

import java.nio.ByteBuffer;
import java.util.Arrays;

/**
 * MICRO-BENCHMARK TOOL:
 * Run this class independently to verify the maximum raw throughput and
 * end-to-end p99 latency of the Chronos Zero-Allocation WAL.
 */
public class StreamingInferencePipeline {
   
    // We expect 29 features (doubles are 8 bytes) + 1 Timestamp (long is 8 bytes)
    private static final int PAYLOAD_SIZE = (29 * 8) + 8;

    public static void main(String[] args) throws Exception {
        System.out.println("Starting Raw Throughput Benchmark...");
       
        WriteAheadLog wal = new WriteAheadLog("benchmark-stream.log");
        LogConsumer consumer = new LogConsumer("benchmark-stream.log");
        OnnxFraudDetector mlModel = new OnnxFraudDetector();

        int totalEvents = 1_000_000; // 1 Million events for the benchmark
        long[] latencyMeasurementsNs = new long[totalEvents];

        // =================================================================
        // THREAD 1: THE EVENT INGESTOR (Simulating max CPU load)
        // =================================================================
        Thread ingestorThread = new Thread(() -> {
            ByteBuffer buffer = ByteBuffer.allocate(PAYLOAD_SIZE);
            double[] fakeCsvRow = new double[29];
            Arrays.fill(fakeCsvRow, 0.5);
           
            for (int i = 0; i < totalEvents; i++) {
                buffer.clear();
                buffer.putLong(System.nanoTime()); // Stamp creation time
                for (double feature : fakeCsvRow) {
                    buffer.putDouble(feature);
                }
                wal.append(buffer.array());
            }
        });

        // =================================================================
        // THREAD 2: THE ML INFERENCE CONSUMER
        // =================================================================
        Thread inferenceThread = new Thread(() -> {
            int eventsProcessed = 0;
            int fraudsDetected = 0;
            ByteBuffer readBuffer = ByteBuffer.allocate(PAYLOAD_SIZE);
            double[] features = new double[29];

            while (eventsProcessed < totalEvents) {
                byte[] rawEvent = consumer.readNext();
               
                if (rawEvent != null) {
                    readBuffer.clear();
                    readBuffer.put(rawEvent);
                    readBuffer.flip();
                   
                    long eventCreationTimeNs = readBuffer.getLong();
                    for (int i = 0; i < 29; i++) {
                        features[i] = readBuffer.getDouble();
                    }
                   
                    boolean isFraud = mlModel.predict(features);
                    if (isFraud) fraudsDetected++;
                   
                    // Measure exact latency
                    latencyMeasurementsNs[eventsProcessed] = System.nanoTime() - eventCreationTimeNs;
                    eventsProcessed++;
                } else {
                    Thread.yield();
                }
            }
            printLatencyReport(latencyMeasurementsNs, fraudsDetected);
        });

        long testStartTime = System.currentTimeMillis();
       
        ingestorThread.start();
        inferenceThread.start();

        ingestorThread.join();
        inferenceThread.join();
       
        long testEndTime = System.currentTimeMillis();
        System.out.printf("Total Benchmark Time: %d ms\n", (testEndTime - testStartTime));
       
        wal.close();
        consumer.close();
    }

    private static void printLatencyReport(long[] latencies, int frauds) {
        Arrays.sort(latencies);
        double p50 = latencies[(int) (latencies.length * 0.50)] / 1000.0;
        double p95 = latencies[(int) (latencies.length * 0.95)] / 1000.0;
        double p99 = latencies[(int) (latencies.length * 0.99)] / 1000.0;
        double max = latencies[latencies.length - 1] / 1000.0;

        System.out.println("\n====================================================");
        System.out.println("🚀 CHRONOS AI: BENCHMARK REPORT");
        System.out.println("====================================================");
        System.out.println("End-to-End Latency (Ingestion -> Storage -> ML Score):");
        System.out.printf("  p50 (Median):   %.2f microseconds\n", p50);
        System.out.printf("  p95 Latency:    %.2f microseconds\n", p95);
        System.out.printf("  p99 Latency:    %.2f microseconds\n", p99);
        System.out.printf("  Max Latency:    %.2f microseconds\n", max);
        System.out.println("====================================================");
    }
}