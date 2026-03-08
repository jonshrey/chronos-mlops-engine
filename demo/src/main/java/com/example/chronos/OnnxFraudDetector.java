package com.example.chronos;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;

import java.nio.FloatBuffer;
import java.util.Collections;

/**
 * 100/10 MLOps Infrastructure:
 * Executes a pre-compiled ONNX model using the highly optimized C++ ONNX Runtime.
 */
public class OnnxFraudDetector {
    private final OrtEnvironment env;
    private final OrtSession session;
    private final double threshold = 0.5;

    public OnnxFraudDetector(String modelPath) throws Exception {
        // 1. Initialize the ONNX C++ Runtime Environment
        this.env = OrtEnvironment.getEnvironment();
       
        // 2. Load the compiled machine learning model into memory
        this.session = env.createSession(modelPath, new OrtSession.SessionOptions());
        System.out.println("🧠 ONNX Runtime Initialized. Model loaded successfully.");
    }

    public boolean predict(double[] features) {
        try {
            // ONNX expects 32-bit floats for maximum hardware speed
            float[] floatFeatures = new float[features.length];
            for (int i = 0; i < features.length; i++) {
                floatFeatures[i] = (float) features[i];
            }

            // Define the Tensor shape: 1 batch, 29 features (1x29 matrix)
            long[] shape = new long[]{1, features.length};
           
            // Map the Java array into an ONNX C++ Tensor
            OnnxTensor tensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(floatFeatures), shape);
           
            // 💥 EXECUTE THE COMPILED MODEL
            // "features" is the input name defined when the model was trained
            OrtSession.Result results = session.run(Collections.singletonMap("features", tensor));
           
            // Extract the raw probability score from the output tensor
            float[][] output = (float[][]) results.get(0).getValue();
            float fraudProbability = output[0][0];

            // Prevent C++ memory leaks by explicitly closing the resources
            results.close();
            tensor.close();

            return fraudProbability >= threshold;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
