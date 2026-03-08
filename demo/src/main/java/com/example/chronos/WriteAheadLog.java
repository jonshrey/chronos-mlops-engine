package com.example.chronos;
import java.io.RandomAccessFile;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Chronos WAL: A Zero-Allocation, Memory-Mapped Write Ahead Log.
 * This bypasses the JVM heap and writes directly to OS virtual memory.
 */
public class WriteAheadLog {
   
    // We map 1 Gigabyte of the hard drive directly into RAM
    private static final int MEMORY_MAP_SIZE = 1024 * 1024 * 1024;
   
    private final MappedByteBuffer buffer;
    private final FileChannel fileChannel;
   
    // Using hardware-level atomic instructions instead of synchronized locks
    private final AtomicInteger currentOffset = new AtomicInteger(0);

    public WriteAheadLog(String filePath) throws Exception {
        // Open the file at the OS level (Read/Write)
        RandomAccessFile file = new RandomAccessFile(filePath, "rw");
        this.fileChannel = file.getChannel();
       
        // Map the file directly into memory. This is the "magic" that makes it blisteringly fast.
        this.buffer = fileChannel.map(FileChannel.MapMode.READ_WRITE, 0, MEMORY_MAP_SIZE);
    }

    /**
     * Appends a message to the log lock-free.
     * Multiple threads can call this simultaneously without blocking each other.
     */
    public boolean append(byte[] message) {
        int messageLength = message.length;
       
        // 1. Atomically claim a spot in the buffer (Compare-And-Swap)
        // This takes nanoseconds and never locks the CPU.
        int writePosition = currentOffset.getAndAdd(messageLength + 4);
       
        if (writePosition + messageLength + 4 > MEMORY_MAP_SIZE) {
            return false; // Buffer is full!
        }

        // 2. Write the size of the message, then the message itself
        buffer.putInt(writePosition, messageLength);
       
        // 3. Write the payload directly to mapped memory
        for (int i = 0; i < messageLength; i++) {
            buffer.put(writePosition + 4 + i, message[i]);
        }
       
        return true;
    }

    public void close() throws Exception {
        // Force the OS to flush any remaining memory to the physical disk
        buffer.force();
        fileChannel.close();
    }
}
