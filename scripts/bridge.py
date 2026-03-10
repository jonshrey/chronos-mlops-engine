import asyncio
import websockets
import json
import requests
import threading
import websocket # from the websocket-client package

# Global variable to pass data between the Binance listener and the UI broadcaster
latest_scored_trade = None

# 1. Listen to Binance and Ping Chronos
def listen_to_binance():
    def on_message(ws, message):
        global latest_scored_trade
        data = json.loads(message)
       
        # Extract Trade Info (s = symbol, p = price, q = quantity)
        trade = {
            "symbol": data['s'],
            "price": float(data['p']),
            "volume": float(data['q'])
        }
       
        try:
            java_payload = { 
                "features": [trade["price"], trade["volume"]] + [0.0]*27
            }
            # Send to your Chronos Spring Boot API
            res = requests.post("http://localhost:8080/api/inference/score", json=java_payload)
            score_data = res.json()

            print("RAW JAVA RESPONSE:", score_data) # Debugging line to see the raw response from Java
           
            # Save the result so the React UI can grab it
            latest_scored_trade = {
                "price": trade["price"],
                "volume": trade["volume"],
                "score": score_data.get("score", 0.0),
                "latency": score_data.get("latency_micros", 42) # Fallback if missing
            }
            print(f"Processed trade at ${trade['price']} | Anomaly Score: {latest_scored_trade['score']}")
        except Exception as e:
            print("Could not reach Chronos Backend. Is it running on port 8080?", e)

    # Connect to Binance Live Trade Stream
    ws = websocket.WebSocketApp("wss://stream.binance.com:9443/ws/btcusdt@trade", on_message=on_message)
    print("📡 Connected to Binance...")
    ws.run_forever()

# 2. Broadcast the scored data to the React UI
async def broadcast_to_ui(websocket, *args):
    global latest_scored_trade
    last_sent = None
    while True:
        # Only send new data to the UI
        if latest_scored_trade and latest_scored_trade != last_sent:
            await websocket.send(json.dumps(latest_scored_trade))
            last_sent = latest_scored_trade
        await asyncio.sleep(0.05) # Check for new trades every 50ms

async def main():
    print("🚀 Starting UI WebSocket Server on ws://localhost:8765...")
    # This correctly starts the websocket server inside an active event loop
    async with websockets.serve(broadcast_to_ui, "localhost", 8765):
        await asyncio.Future()  # This keeps the server running forever

if __name__ == "__main__":
    # Run the Binance listener in the background
    threading.Thread(target=listen_to_binance, daemon=True).start()
   
    # Start the asyncio event loop properly
    asyncio.run(main())
