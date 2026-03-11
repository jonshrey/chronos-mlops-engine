FROM python:3.12-slim
WORKDIR /app

# Install the required Python libraries directly
RUN pip install --no-cache-dir websocket-client websockets requests

# Copy the bridge script into the container
COPY bridge.py .

EXPOSE 8765

# The -u flag ensures Python prints logs to the terminal immediately
CMD ["python", "-u", "bridge.py"]