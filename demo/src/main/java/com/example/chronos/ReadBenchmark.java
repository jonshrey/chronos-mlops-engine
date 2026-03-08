package com.example.chronos;
public class ReadBenchmark {
    public static void main(String[] args) {
        try {
            System.out.println("Initializing Chronos Consumer...");
            LogConsumer consumer = new LogConsumer("chronos-data.log");
           
            int messagesRead = 0;
           
            System.out.println("Starting read benchmark...");
            long startTime = System.currentTimeMillis();

            // Loop and read messages until there are no more left
            while (true) {
                byte[] message = consumer.readNext();
                if (message == null) {
                    break; // We reached the end of the log!
                }
                messagesRead++;
            }

            long endTime = System.currentTimeMillis();
            long durationMs = endTime - startTime;
           
            double readsPerSecond = (messagesRead / (double) durationMs) * 1000;
           
            System.out.println("====================================");
            System.out.println("Read Benchmark Complete!");
            System.out.println("Total Messages Read: " + messagesRead);
            System.out.println("Time taken: " + durationMs + " ms");
            System.out.printf("Read Throughput: %,.2f messages/second\n", readsPerSecond);
            System.out.println("====================================");

            consumer.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
