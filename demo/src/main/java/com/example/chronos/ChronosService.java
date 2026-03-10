package com.example.chronos;

import java.nio.ByteBuffer;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class ChronosService {

    private WriteAheadLog wal;
    private LogConsumer consumer;
    private OnnxFraudDetector mlModel;

    // We expect 29 features + 1 Timestamp
    private static final int PAYLOAD_SIZE = (29 * 8) + 8;

    // This runs automatically when Spring Boot starts
    @PostConstruct
    public void init() throws Exception {
        wal = new WriteAheadLog("production-stream.log");
        consumer = new LogConsumer("production-stream.log");
        mlModel = new OnnxFraudDetector();

        System.out.println("🚀 Chronos WAL and ML Engine Initialized.");
       
        // Start the background Consumer thread to watch the log forever
        new Thread(this::consumeLoop).start();
    }

    // The API will call this method to drop data into the fast lane
    public void ingestTransaction(double[] features) {
        if (features.length != 29) {
            throw new IllegalArgumentException("ML Model requires exactly 29 features.");
        }

        ByteBuffer buffer = ByteBuffer.allocate(PAYLOAD_SIZE);
        // Stamp the exact microsecond the data arrived from the internet
        buffer.putLong(System.nanoTime());
       
        for (double feature : features) {
            buffer.putDouble(feature);
        }
       
        // Push to the OS memory!
        wal.append(buffer.array());
    }

    // The Background ML Inference Loop
    private void consumeLoop() {
        System.out.println("👁️ Consumer Thread is now watching for live events...");
        ByteBuffer readBuffer = ByteBuffer.allocate(PAYLOAD_SIZE);
        double[] features = new double[29];

        while (true) {
            byte[] rawEvent = consumer.readNext();
           
            if (rawEvent != null) {
                readBuffer.clear();
                readBuffer.put(rawEvent);
                readBuffer.flip();
               
                long creationTimeNs = readBuffer.getLong();
                for (int i = 0; i < 29; i++) {
                    features[i] = readBuffer.getDouble();
                }
               
                // EXECUTE ML MATH
                boolean isFraud = mlModel.predict(features);
               
                // MEASURE LATENCY
                long latencyNs = System.nanoTime() - creationTimeNs;
                double latencyMicroseconds = latencyNs / 1000.0;
               
                System.out.printf("🚨 EVENT SCORED | Fraud: %b | End-to-End Latency: %.2f microseconds%n",
                                  isFraud, latencyMicroseconds);
            } else {
                // If no new data, yield to keep CPU usage low
                Thread.yield();
            }
        }
    }
}
