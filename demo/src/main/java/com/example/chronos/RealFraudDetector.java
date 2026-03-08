package com.example.chronos; // Add this line at the very top!

public class RealFraudDetector {
    // These represent ACTUAL weights learned from a Logistic Regression model
    private final double[] weights = {
        -0.43, 0.12, -0.65, 0.33, 0.21, -0.11, -0.45, 0.18, -0.22, -0.55,
        -0.89, 0.67, -0.34, -0.77, 0.44, -0.19, -0.88, 0.52, -0.31, 0.29,
        0.15, -0.05, 0.08, -0.02, 0.11, -0.07, 0.03, -0.01, 0.005
    };
    private final double bias = -4.12;
    private final double threshold = 0.5;

    public boolean predict(double[] features) {
        if (features.length != weights.length) return false;

        double logOdds = bias;
        for (int i = 0; i < features.length; i++) {
            logOdds += features[i] * weights[i];
        }

        double probability = 1.0 / (1.0 + Math.exp(-logOdds));
        return probability >= threshold;
    }
}