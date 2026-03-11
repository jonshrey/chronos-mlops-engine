# ⚡ Chronos: Live Crypto Anomaly Detection & MLOps Engine

An ultra-low latency, zero-allocation Write-Ahead Log (WAL) and online inference engine. Chronos is a distributed, machine-learning-powered real-time streaming application that detects market anomalies ("Whales") in global cryptocurrency trades with sub-millisecond latency.

![React Dashboard Demo](link_to_your_gif.gif)
*(Note: Add a screen recording of your React dashboard flashing a Whale Alert here!)*

## 📖 Overview

Designed to handle extreme high-velocity event ingestion, Chronos bypasses standard JVM memory management overhead to deliver predictable, microsecond-level latency. 

Recently upgraded into a full-stack architecture, the system streams live Bitcoin (BTC) trades from Binance, executes a hardware-accelerated **ONNX** anomaly detection model in a **Java/Spring Boot** backend, and broadcasts the scores via WebSockets to a **React** frontend—all averaging **~220 microseconds** of end-to-end inference latency.

## 🏗️ System Architecture

The project is structured as a containerized microservice ecosystem:

1. **The Data Bridge (Python & WebSockets):** Connects to the live Binance market stream, ingests global BTC trades, and forwards them to the backend while managing a local WebSocket server for the UI.
2. **The Inference Engine (Java & Spring Boot):** 
   * **Zero-Copy Storage:** Utilizes `MappedByteBuffer` to memory-map (mmap) append-only logs directly into the OS page cache, eliminating JVM Garbage Collection (GC) pauses.
   * **Lock-Free Concurrency:** Employs CPU-level atomic instructions (`AtomicInteger` Compare-And-Swap) to manage log offsets without thread starvation.
   * **Hardware-Accelerated ML:** Integrates the **ONNX C++ runtime** to execute an Isolation Forest machine learning model natively in memory.
3. **The Live Dashboard (React & TypeScript):** A Vite-powered frontend utilizing Recharts to visualize real-time BTC pricing, algorithmic anomaly alerts, and live engine latency metrics.

### Data Flow
```mermaid
graph TD
    classDef client fill:#34A853,stroke:#188038,stroke-width:2px,color:white,font-weight:bold;
    classDef gateway fill:#4285F4,stroke:#1A73E8,stroke-width:2px,color:white,font-weight:bold;
    classDef storage fill:#FBBC05,stroke:#F29900,stroke-width:2px,color:black,font-weight:bold;
    classDef consumer fill:#EA4335,stroke:#C5221F,stroke-width:2px,color:white,font-weight:bold;
    classDef external fill:#80868B,stroke:#5F6368,stroke-width:2px,color:white,font-weight:bold;

    Binance["📈 Binance Live Stream"]:::external
    Bridge["🐍 Python WebSocket Bridge"]:::client
    Gateway["🚀 Java Spring Boot API"]:::gateway
    WAL[("💾 Memory-Mapped WAL (Zero-Allocation)")]:::storage
    ML["🧠 ONNX ML Engine (C++ Runtime)"]:::consumer
    UI["💻 React / TS Live Dashboard"]:::client

    Binance -- "Live BTC Trades" --> Bridge
    Bridge -- "POST /api/inference/score" --> Gateway
    Gateway -- "Append (CAS)" --> WAL
    Gateway -- "Features" --> ML
    ML -- "Anomaly Score & Latency" --> Gateway
    Gateway -- "JSON Response" --> Bridge
    Bridge -- "Broadcast (ws://)" --> UI

