package com.example.chronos;
import java.io.RandomAccessFile;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;

/**
 * Chronos Consumer: Reads from the memory-mapped Write-Ahead Log.
 * It reads directly from RAM, achieving zero-copy ultra-low latency.
 */
public class LogConsumer {
   
    private static final int MEMORY_MAP_SIZE = 1024 * 1024 * 1024; // 1 GB
   
    private final MappedByteBuffer buffer;
    private final FileChannel fileChannel;
    private int readOffset = 0; // Tracks where we are in the log

    public LogConsumer(String filePath) throws Exception {
        // Open the file in "read-only" mode
        RandomAccessFile file = new RandomAccessFile(filePath, "r");
        this.fileChannel = file.getChannel();
       
        // Map the same file directly into memory
        this.buffer = fileChannel.map(FileChannel.MapMode.READ_ONLY, 0, MEMORY_MAP_SIZE);
    }

    /**
     * Reads the next sequential message from the log.
     * Returns null if we have reached the end of the written data.
     */
    public byte[] readNext() {
        // 1. Read the 4-byte integer that tells us how long the message is
        int messageLength = buffer.getInt(readOffset);
       
        // If the length is 0, it means we hit empty memory (no more messages yet)
        if (messageLength == 0) {
            return null;
        }

        // 2. Extract the actual message payload
        byte[] message = new byte[messageLength];
        for (int i = 0; i < messageLength; i++) {
            message[i] = buffer.get(readOffset + 4 + i);
        }
       
        // 3. Move our offset forward so we are ready for the next message
        readOffset += (4 + messageLength);
       
        return message;
    }

    public void close() throws Exception {
        fileChannel.close();
    }
}