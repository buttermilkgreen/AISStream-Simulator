# AISStream Simulator

A simulated, standalone WebSocket server and interactive visual administration dashboard for `aisstream.io` offline testing. This allows running the AIS Ship Tracker and AISStream Uptime Monitor locally without hitting connection limits, rate limits, or IP bans of the live public stream.

---

## What the Simulator Does

The AISStream Simulator acts as a mock server for clients expecting the real-time websocket feed from `aisstream.io`. It includes:

1. **Standalone WebSocket Server**: Binds to port `8088` (default) and listens for client connections on the `/v0/stream` path, emulating the official streaming endpoint.
2. **Physics & Drift Simulation Engine**:
   - Computes vessel movements every second based on Speed Over Ground (SOG) in knots and Course Over Ground (COG) in degrees.
   - Adds realistic noise to drift variables (e.g., small heading fluctuations and speed adjustments over time).
   - Simulates vessel turnover, causing a small percentage of ships to "retire" (sail away / cease transmission) and spawning new ones at the margins of the map.
3. **Dynamic Bounding Box Reseeding**: Detects the coordinates requested by the client's subscription. If the simulated ships are outside those boundaries, the simulator dynamically scatters and re-seeds them within the subscriber's bounding box so that they start receiving telemetry instantly.
4. **Leaflet Interactive Map**: A gorgeous, dark-themed admin dashboard running at `http://localhost:8088`. It displays landmasses, active vessel locations (using SVG markers rotated according to COG), client details, and live logs.
5. **Simulation Control Panel**:
   - **Pause/Resume** ship movement.
   - **Drift Speed Multiplier** (from 1x to 10x speed).
   - **Simulate Empty Stream**: Keeps the socket open but halts transmission of shipping packets to clients (perfect for testing client watchdog timeout logic).
   - **Simulate Authentication Failure**: Instantly sends authentication error payloads and disconnects subscribing clients.
   - **Drop Active Clients**: Triggers abrupt socket drops (abnormal closure code `1006` via TCP termination) or graceful close frames (codes `1000` or `1008`) to verify client reconnection logic.
   - **Custom Ship Injection & Removal**: Allows administrative injection of custom vessels (with specific MMSI, name, coords, speed, class) and removing existing ones.

---

## Supported AISStream WebSocket Features

The simulator implements the core subscription handshake and message streaming syntax of the official `aisstream.io` service:

### 1. Subscription Message Parsing
The server case-insensitively parses subscription messages sent by clients upon connecting. It handles:
- **`APIKey`** (or `ApiKey`, `apikey`): Acknowledges connections when present (no actual validation is performed).
- **`BoundingBoxes`** (or `boundingBoxes`, `boundingboxes`): Limits streamed telemetry to ships within the specified latitude/longitude boundaries. Supports multiple bounding boxes.
- **`FiltersShipMMSI`** (or `FiltersShipMmsi`, `FiltersByMMSI`): Restricts messages to specific vessel MMSIs.
- **`FilterMessageTypes`** (or `filterMessageTypes`): Streams only requested AIS message types.

### 2. Message Types & Formats
Messages are wrapped in the official JSON wrapper structure containing `MessageType`, `MetaData` (MMSI, ShipName), and the corresponding message contents:
- **`PositionReport`** (AIS Messages 1, 2, 3 - Class A Telemetry): Includes `Latitude`, `Longitude`, `Sog`, `Cog`, `TrueHeading`, and `NavigationalStatus`.
- **`StandardClassBPositionReport`** (AIS Message 18 - Class B Telemetry): Simulates position reports specifically for Class B vessels.
- **`ShipStaticData`** (AIS Message 5 - Voyage details): Broadcasted periodically (and upon client subscription). Includes `Destination`, `Eta`, `Dimension`, `ImoNumber`, `CallSign`, and `Type`.
- **`AidsToNavigationReport`** (AIS Message 21 - AtoNs): Emulates reports from stationary maritime aids (e.g., lighthouses, buoys) with custom message properties.
- **`BaseStationReport`** (AIS Message 4 - Base Station): Simulates reports from physical ground stations, providing their location and UTC time.

---

## Feature Gaps & Limitations (What is NOT Supported)

While the simulator is highly effective for offline testing, it is not a 1:1 copy of the live production environment. The following gaps exist:

### 1. Limited Message Types
The official `aisstream.io` supports over 20 distinct AIS message schemas. The simulator **only supports five message types**:
*   `PositionReport`
*   `StandardClassBPositionReport`
*   `ShipStaticData`
*   `AidsToNavigationReport`
*   `BaseStationReport`

*If your client application filters on or expects other message types (e.g., `StaticDataReport`, `ExtendedClassBPositionReport`, `SafetyBroadcastMessage`, `AddressedSafetyMessage`, `BinaryBroadcastMessage`, etc.), it will not receive them from the simulator.*

### 2. Simplified Field Schemas
- **Hardcoded & Mocked Values**: Several fields inside generated reports are static or simplified. For example, in `ShipStaticData`, dimensions are hardcoded (`Dimension.A: 200` or `150`, `B: 50`) and do not utilize `C` and `D`. The `Eta` field is also hardcoded (always Month: 7, Day: 10, Hour: 12, Minute: 0).
- **Class B Schema Overlap**: In the simulation, `StandardClassBPositionReport` sends the same schema fields as Class A `PositionReport` (including `NavigationalStatus` and `TrueHeading`), whereas in the official AIS specification, Class B formats differ and exclude several Class A telemetry fields.
- **Flicker Simulation**: The simulator mocks occasional sensor data drops by omitting `Sog`, `Cog`, `TrueHeading`, or `NavigationalStatus` in 5% of the position reports to simulate realistic GPS jitter and packet dropouts.

### 3. Mocked Security & Infrastructure
- **Plain WebSocket (WS)**: The simulator runs over unencrypted WebSocket (`ws://`). It does not natively support Secure WebSocket (`wss://`) connections. If `wss://` is required by your client, you must run the simulator behind a reverse proxy (e.g., Nginx or Traefik) that handles TLS termination.
- **No True Key Authentication**: The simulator accepts any API key as valid. It does not connect to the internet or validate keys against `aisstream.io` database.
- **No Rate Limiting / Concurrency Caps**: Unlike the official stream, which actively throttles connections, rate-limits requests, and enforces single-connection-per-key policies, the simulator enforces no limits, allowing aggressive local stress-testing of client code.
- **Simplified Vessel Physics**: Ships move in a straight line relative to their heading, wrap around map margins, and drift indefinitely. The simulator does not calculate land collisions, geographic pathfinding, or ship routing lanes.

---

## Installation & Setup

### Local Installation

1. **Navigate to the Project Directory**:
   ```bash
   cd "AIS Sim"
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

### Docker Installation

If you prefer running via Docker, you can build and start the container using Docker Compose:

1. **Build & Run**:
   ```bash
   docker-compose up -d --build
   ```

2. **Access the App**:
   The admin dashboard will be available at [http://localhost:8088](http://localhost:8088) and the client stream at `ws://localhost:8088/v0/stream`.

---

## System Architecture

For a detailed design map, message schemas (Position Report & Ship Static Data), and state transitions, refer to the [ARCHITECTURE.md](ARCHITECTURE.md) document.
