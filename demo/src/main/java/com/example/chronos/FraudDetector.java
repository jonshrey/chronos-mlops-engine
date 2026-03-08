package com.example.chronos;
/**
 * Simulates an embedded Machine Learning Inference Engine.
 * In a real production system, this class would load an ONNX model
 * or TensorFlow SavedModel via JNI to execute neural network weights.
 */
public class FraudDetector {

    // Simulates weights learned from a trained ML model
    private final double[] modelWeights = {0.85, 1.2, 0.45, 2.1, 0.05};
    private final double fraudThreshold = 0.90;

    /**
     * Scores the raw transaction payload.
     * Returns true if the transaction is flagged as fraudulent (anomalous).
     */
    public boolean isFraudulent(byte[] transactionPayload) {
        // We simulate "feature extraction" by hashing/sampling the raw bytes
        double score = 0.0;
       
        // Simulate a vector dot-product (Matrix Multiplication)
        // which is exactly what a Neural Network or Linear Regression does under the hood.
        for (int i = 0; i < modelWeights.length; i++) {
            // Safely extract a 'feature' from the byte array
            int featureValue = transactionPayload[i % transactionPayload.length] & 0xFF;
           
            // Normalize the feature between 0 and 1, multiply by the model weight
            score += (featureValue / 255.0) * modelWeights[i];
        }
       
        // Normalize final score between 0 and 1 using a simple Sigmoid-like approximation
        double normalizedScore = score / modelWeights.length;
       
        return normalizedScore > fraudThreshold;
    }
}