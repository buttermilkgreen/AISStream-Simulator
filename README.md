# AISStream Simulator

A simulated, standalone WebSocket server and interactive visual administration dashboard for `aisstream.io` offline testing. This allows running the AIS Ship Tracker and AISStream Uptime Monitor locally without hitting connection limits, rate limits, or IP bans of the live public stream.

---

## Features

- **AISStream Handshake Support**: Serves clients connecting to `ws://localhost:8088/v0/stream` expecting the standard AISStream.io subscription handshake.
- **Dynamic Bounding Box Reseeding**: Automatically detects client subscription coordinates and scatters simulated ships within their target bounding box so they start receiving data instantly, regardless of what area they configure.
- **Leaflet Interactive Map**: A gorgeous, dark-themed geographic visualizer showing real landmasses and coastlines (centered on your client's active bounding box).
- **Interactive Ship Markers**: Displays vessels as rotating SVG arrows indicating their Course Over Ground (COG). Hovering or clicking on a marker shows its name, SOG, heading, and status.
- **Simulation Control Panel**:
  - **Pause/Resume** ship movement.
  - **Drift Speed Multiplier** (from 1x to 10x speed).
  - **Simulate Empty Stream**: Halts transmission of shipping packets to clients (making them look like an empty ocean) while still keeping the socket connection open. Perfect for testing "Silent Failure" watchdogs.
  - **Simulate Authentication Failure**: Rejects incoming client subscriptions with authentication error payloads and disconnects them.
  - **Drop Active Clients**: Simulates abrupt network drops (like code `1006` via TCP termination) or graceful close frames (like code `1000` or `1008`).
  - **Custom Ship Injection Form**: Instantly spawns and broadcasts a custom vessel with your chosen MMSI, name, coords, and speed. 

---

## Installation & Setup

1. **Extract & Open**:
   Navigate to the `ais-simulator` directory:
   ```bash
   cd ais-simulator
   ```

2. **Install Dependencies**:
   Ensure Node.js is installed, then run:
   ```bash
   npm install
   ```

3. **Start the Simulator**:
   ```bash
   npm start
   ```
   The dashboard runs at [http://localhost:8088](http://localhost:8088) and the client stream is exposed at `ws://localhost:8088/v0/stream`.

4. **Connect Your Client**:
   Change your local client's connection URL from:
   `wss://stream.aisstream.io/v0/stream`
   to:
   `ws://localhost:8088/v0/stream`

---

## System Architecture

For a detailed design map, message schemas (Position Report & Ship Static Data), and state transitions, refer to the [ARCHITECTURE.md](ARCHITECTURE.md) document.
