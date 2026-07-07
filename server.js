const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const PORT = process.env.PORT || 8088;


// Simulated ship database
let ships = [
  {
    mmsi: 992351002,
    name: "SINGAPORE EAST LIGHT",
    type: 20, // Aids to navigation
    vessel_class: "AtoN",
    lat: 1.25,
    lon: 104.05,
    sog: 0.0,
    cog: 0.0,
    heading: 511,
    nav_status: 15,
    destination: "",
    imo: 0,
    callsign: ""
  },
  {
    mmsi: 5630001,
    name: "SINGAPORE AIS BASE STATION",
    type: 4, // Base station
    vessel_class: "BaseStation",
    lat: 1.32,
    lon: 103.88,
    sog: 0.0,
    cog: 0.0,
    heading: 511,
    nav_status: 15,
    destination: "",
    imo: 0,
    callsign: ""
  },
  {
    mmsi: 538008272,
    name: "MAERSK MC-KINNEY MOLLER",
    type: 70, // Cargo
    vessel_class: "Class A",
    lat: 1.25,
    lon: 103.75,
    sog: 12.4,
    cog: 85.0,
    heading: 85,
    nav_status: 0, // Underway using engine
    destination: "SINGAPORE",
    imo: 9632064,
    callsign: "OUJD2"
  },
  {
    mmsi: 477114600,
    name: "CMA CGM MARCO POLO",
    type: 70, // Cargo
    vessel_class: "Class A",
    lat: 1.30,
    lon: 103.82,
    sog: 15.1,
    cog: 90.0,
    heading: 88,
    nav_status: 0,
    destination: "HONG KONG",
    imo: 9607332,
    callsign: "VRKR2"
  },
  {
    mmsi: 235102689,
    name: "STENA IMPERATOR",
    type: 80, // Tanker
    vessel_class: "Class A",
    lat: 1.22,
    lon: 103.95,
    sog: 10.2,
    cog: 265.0,
    heading: 263,
    nav_status: 0,
    destination: "ROTTERDAM",
    imo: 9667239,
    callsign: "2HGP4"
  },
  {
    mmsi: 311000523,
    name: "EVER GIVEN",
    type: 70, // Cargo
    vessel_class: "Class A",
    lat: 1.28,
    lon: 103.65,
    sog: 0.0,
    cog: 0.0,
    heading: 190,
    nav_status: 1, // At anchor
    destination: "ROTTERDAM",
    imo: 9811000,
    callsign: "H3RC"
  },
  {
    mmsi: 563032700,
    name: "GRACE DAHLIA",
    type: 80, // Tanker
    vessel_class: "Class A",
    lat: 1.18,
    lon: 103.70,
    sog: 8.7,
    cog: 120.0,
    heading: 121,
    nav_status: 0,
    destination: "TOKYO",
    imo: 9548483,
    callsign: "9V9423"
  },
  {
    mmsi: 992351001,
    name: "LUCKY DOLPHIN",
    type: 37, // Pleasure craft / Class B
    vessel_class: "Class B",
    lat: 1.35,
    lon: 103.98,
    sog: 5.4,
    cog: 45.0,
    heading: 45,
    nav_status: 15, // Defined for Class B
    destination: "LOCAL CRUISE",
    imo: 0,
    callsign: "LUCKYB"
  }
];

// Helper data for random ship spawning
const RANDOM_NAMES = [
  "OCEAN PATRIOT", "PACIFIC TRIDENT", "NORDIC QUEEN", "BALTIC STAR", "ASIAN CLIPPER",
  "ATLANTIC VOYAGER", "GLOBAL SPIRIT", "SEAWING", "MARLIN I", "PEGASUS VII",
  "APOLLO", "ORION", "POLARIS", "AURORA", "SIERRA", "SOVEREIGN OF THE SEAS",
  "HERCULES", "TITAN", "NEPTUNE", "POSEIDON", "TRITON", "VENTURE", "EXPLORER",
  "GALAXY", "COSMOS", "STARLIGHT", "MOONLIGHT", "SUNSHINE", "DAYLIGHT", "NIGHTWATCH",
  "SHADOW", "ECLIPSE", "SOLSTICE", "EQUINOX", "HORIZON", "MERIDIAN", "ZENITH",
  "NADIR", "APEX", "PINNACLE", "SUMMIT", "CREST", "PEAK", "VALLEY", "CANYON",
  "RIVER", "STREAM", "BROOK", "CREEK", "LAKE", "POND", "OCEANUS", "NEPTUNUS",
  "SALACIA", "THALASSA", "PONTUS", "TRITONIS", "AMPHITRITE", "NEREUS", "DORIS",
  "THEMIS", "TETHYS", "OCEANID", "NAIAD", "HALIA", "LIMNAD", "PEGAE", "POTAMID",
  "HYAD", "PLEIAD", "ALCYONE", "CELAENO", "ELECTRA", "MAIA", "MEROPE", "STEROPE",
  "TAYGETE", "CALYPSO", "CIRCE", "MEDEA", "HECATE", "SELENE", "HELIOS", "EOS",
  "HYPERION", "COEUS", "CRIUS", "IAPETUS", "CRONUS", "RHEA", "OCEAN EXPRESS",
  "PACIFIC EXPRESS", "ATLANTIC EXPRESS", "GLOBAL EXPRESS", "SEA EXPRESS", "MARLIN EXPRESS",
  "APOLLO EXPRESS", "ORION EXPRESS", "POLARIS EXPRESS", "AURORA EXPRESS",
  "MAJESTIC BLUE", "SOVEREIGN BLUE", "ROYAL BLUE", "IMPERIAL BLUE", "REGAL BLUE",
  "CROWN BLUE", "DYNASTY BLUE", "EMPIRE BLUE", "KINGDOM BLUE", "MONARCH BLUE",
  "SEAFARER I", "SEAFARER II", "SEAFARER III", "SEAFARER IV", "SEAFARER V",
  "WAVETRAVELER", "WAVEDANCER", "WAVEPASSENGER", "WAVEMASTER", "WAVERUNNER",
  "BLUE HORIZON", "GREEN HORIZON", "RED HORIZON", "GOLD HORIZON", "SILVER HORIZON",
  "BRONZE HORIZON", "PLATINUM HORIZON", "DIAMOND HORIZON", "EMERALD HORIZON", "RUBY HORIZON",
  "NORTH STAR", "SOUTH STAR", "EAST STAR", "WEST STAR", "MORNING STAR",
  "EVENING STAR", "GUIDING STAR", "LODE STAR", "POLE STAR", "BRIGHT STAR",
  "SEA BREEZE", "OCEAN BREEZE", "GALE FORCE", "TEMPEST", "HURRICANE",
  "TYPHOON", "MONSOON", "ZEPHYR", "BOREAS", "AUSTER"
];

const RANDOM_DESTINATIONS = [
  "SHANGHAI", "SINGAPORE", "ROTTERDAM", "HONG KONG", "PORT KLANG", "TOKYO",
  "LOS ANGELES", "NEW YORK", "LONDON", "HAMBURG", "BUSAN", "DUBAI", "PANAMA"
];

const RANDOM_CALLSIGNS = [
  "WDB1234", "XYA9876", "ZCQ5521", "MLP8843", "KTR2091", "PQA3302", "BHG7716"
];

function initializeShipProperties(ship, isInitial = false) {
  if (ship.is_unknown_name === undefined) {
    ship.is_unknown_name = !isInitial && (Math.random() < 0.05);
  }
  if (ship.is_unknown_name && !ship.unknown_name_placeholder) {
    const unknownNames = ["Unknown Ship", "Unknown Ship Name", "UNKNOWN", "", "   "];
    ship.unknown_name_placeholder = unknownNames[Math.floor(Math.random() * unknownNames.length)];
  }

  if (ship.missing_destination === undefined) ship.missing_destination = Math.random() < 0.1;
  if (ship.missing_eta === undefined) ship.missing_eta = Math.random() < 0.1;
  if (ship.missing_dimension === undefined) ship.missing_dimension = Math.random() < 0.1;
  if (ship.missing_imo === undefined) ship.missing_imo = Math.random() < 0.1;
  if (ship.missing_callsign === undefined) ship.missing_callsign = Math.random() < 0.1;
  if (ship.missing_type === undefined) ship.missing_type = Math.random() < 0.1;

  if (ship.ticks_since_spawn === undefined) {
    ship.ticks_since_spawn = isInitial ? 360 : 0;
  }
  if (ship.static_delay_ticks === undefined) {
    ship.static_delay_ticks = isInitial ? 0 : Math.floor(Math.random() * 360);
  }
  return ship;
}

function spawnRandomShip(edge, scattered = false) {
  const mmsi = Math.floor(Math.random() * 800000000) + 100000000;
  
  // Find a name that is not currently in use by any simulated vessel
  const activeNames = new Set(ships.map(s => s.name));
  const availableNames = RANDOM_NAMES.filter(name => !activeNames.has(name));
  const name = (availableNames.length > 0)
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const destination = RANDOM_DESTINATIONS[Math.floor(Math.random() * RANDOM_DESTINATIONS.length)];
  const callsign = RANDOM_CALLSIGNS[Math.floor(Math.random() * RANDOM_CALLSIGNS.length)];
  const type = Math.random() < 0.6 ? 70 : 80;
  const vessel_class = Math.random() < 0.85 ? "Class A" : "Class B";
  const imo = Math.floor(Math.random() * 9000000) + 1000000;
  
  let lat, lon, cog;
  
  const latMin = MAP_BOUNDS.latMin;
  const latMax = MAP_BOUNDS.latMax;
  const lonMin = MAP_BOUNDS.lonMin;
  const lonMax = MAP_BOUNDS.lonMax;
  const latRange = latMax - latMin;
  const lonRange = lonMax - lonMin;

  if (scattered) {
    lat = latMin + Math.random() * latRange;
    lon = lonMin + Math.random() * lonRange;
    cog = Math.random() * 360;
  } else {
    if (!edge) {
      const edges = ['north', 'south', 'east', 'west'];
      edge = edges[Math.floor(Math.random() * edges.length)];
    }

    if (edge === 'north') {
      lat = latMax - 0.01;
      lon = lonMin + Math.random() * lonRange;
      cog = 135 + Math.random() * 90;
    } else if (edge === 'south') {
      lat = latMin + 0.01;
      lon = lonMin + Math.random() * lonRange;
      cog = (315 + Math.random() * 90) % 360;
    } else if (edge === 'east') {
      lat = latMin + Math.random() * latRange;
      lon = lonMax - 0.01;
      cog = 225 + Math.random() * 90;
    } else {
      lat = latMin + Math.random() * latRange;
      lon = lonMin + 0.01;
      cog = 45 + Math.random() * 90;
    }
  }

  const newShip = {
    mmsi,
    name,
    type,
    vessel_class,
    lat,
    lon,
    sog: 8 + Math.random() * 12,
    cog,
    heading: Math.round(cog),
    nav_status: vessel_class === "Class B" ? 15 : 0,
    destination,
    imo,
    callsign
  };

  initializeShipProperties(newShip, false);
  return newShip;
}

ships.forEach(ship => initializeShipProperties(ship, true));


// Map limits (defaults to Singapore bounds)
let MAP_BOUNDS = {
  latMin: 1.13,
  latMax: 1.47,
  lonMin: 103.58,
  lonMax: 104.18
};

// Navigation Status mapping
const NAV_STATUS_MAP = {
  0: "Underway using engine",
  1: "At anchor",
  5: "Moored",
  15: "Not defined"
};

// Simulation State
let isPaused = false;
let simulationSpeed = 1; // Speed multiplier (1x, 2x, 5x, 10x)
let targetShipCount = 15; // Target number of active ships (adjustable from 5 to 100)
let authErrorActive = false;
let emptyStreamActive = false;
let logHistory = [];
let activeAISClients = new Set();
let adminClients = new Set();

function addLog(type, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message
  };
  logHistory.push(logEntry);
  if (logHistory.length > 100) logHistory.shift();
  
  // Broadcast to all admin clients
  const logMsg = JSON.stringify({ event: 'log', data: logEntry });
  for (const admin of adminClients) {
    if (admin.readyState === WebSocket.OPEN) {
      admin.send(logMsg);
    }
  }
  console.log(`[${logEntry.timestamp}] [${type.toUpperCase()}] ${message}`);
}

// Broadcast states to admin clients
function broadcastState() {
  const statePayload = JSON.stringify({
    event: 'state',
    data: {
      isPaused,
      simulationSpeed,
      targetShipCount,
      authErrorActive,
      emptyStreamActive,
      MAP_BOUNDS,
      ships,
      activeConnections: Array.from(activeAISClients).map(c => ({
        id: c.clientId,
        ip: c.clientIp,
        connectedAt: c.connectedAt,
        boundingBoxes: c.boundingBoxes
      }))
    }
  });
  for (const admin of adminClients) {
    if (admin.readyState === WebSocket.OPEN) {
      admin.send(statePayload);
    }
  }
}

function normalizeBoundingBoxes(rawBoxes) {
  if (!rawBoxes) return [];
  if (!Array.isArray(rawBoxes)) return [];
  
  // If flat format: [[lat1, lon1], [lat2, lon2]]
  if (rawBoxes.length === 2 && 
      Array.isArray(rawBoxes[0]) && rawBoxes[0].length === 2 && 
      typeof rawBoxes[0][0] === 'number') {
    return [rawBoxes];
  }
  
  const normalized = [];
  rawBoxes.forEach(box => {
    if (Array.isArray(box) && box.length === 2 && 
        Array.isArray(box[0]) && box[0].length === 2 &&
        Array.isArray(box[1]) && box[1].length === 2) {
      normalized.push(box);
    }
  });
  return normalized;
}

// Helper to check if coordinates are within bounding boxes
function isWithinBounds(lat, lon, boundingBoxes) {
  if (!boundingBoxes || boundingBoxes.length === 0) return true;
  for (const box of boundingBoxes) {
    // A box is usually [[minLat, minLon], [maxLat, maxLon]] or similar structure
    // Let's support standard AISStream format: [[[lat_min, lon_min], [lat_max, lon_max]]]
    if (Array.isArray(box) && box.length === 2) {
      const [p1, p2] = box;
      const minLat = Math.min(p1[0], p2[0]);
      const maxLat = Math.max(p1[0], p2[0]);
      const minLon = Math.min(p1[1], p2[1]);
      const maxLon = Math.max(p1[1], p2[1]);
      if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
        return true;
      }
    }
  }
  return false;
}

function isShipNeededByAnyClient(ship) {
  if (activeAISClients.size === 0) return true;
  
  // If the ship is static, we always keep it
  if (ship.vessel_class === "AtoN" || ship.vessel_class === "BaseStation") {
    return true;
  }

  // Check if any client has bounding boxes defined
  let anyClientHasBounds = false;
  for (const client of activeAISClients) {
    if (client.boundingBoxes && client.boundingBoxes.length > 0) {
      anyClientHasBounds = true;
      
      const buffer = 0.03;
      for (const box of client.boundingBoxes) {
        if (Array.isArray(box) && box.length === 2) {
          const [p1, p2] = box;
          const minLat = Math.min(p1[0], p2[0]) - buffer;
          const maxLat = Math.max(p1[0], p2[0]) + buffer;
          const minLon = Math.min(p1[1], p2[1]) - buffer;
          const maxLon = Math.max(p1[1], p2[1]) + buffer;
          if (ship.lat >= minLat && ship.lat <= maxLat && ship.lon >= minLon && ship.lon <= maxLon) {
            return true;
          }
        }
      }
    }
  }

  // If no client has bounding boxes defined, then we keep all simulated ships in the background.
  if (!anyClientHasBounds) {
    return true;
  }

  // If there are clients with bounding boxes, but this ship is not in any of them, it is no longer needed.
  return false;
}

function matchesMessageType(client, msgType) {
  if (!client.filterMessageTypes || client.filterMessageTypes.length === 0) {
    return true;
  }
  return client.filterMessageTypes.includes(msgType);
}

// Format an AIS message to client
function buildAISTelemetryMessage(ship) {
  const msgType = ship.vessel_class === "Class B" ? "StandardClassBPositionReport" : "PositionReport";
  
  // Use persistent ship name status
  let name = ship.is_unknown_name ? ship.unknown_name_placeholder : ship.name;

  const posReport = {
    Latitude: ship.lat,
    Longitude: ship.lon,
  };

  // 95% chance to populate Sog, Cog, Heading, NavigationalStatus (slight dynamic flicker is realistic for sensor reports)
  if (Math.random() < 0.95) {
    posReport.Sog = Math.random() < 0.02 ? 102.3 : ship.sog;
  }
  if (Math.random() < 0.95) {
    posReport.Cog = Math.random() < 0.02 ? 360.0 : ship.cog;
  }
  if (Math.random() < 0.95) {
    posReport.TrueHeading = Math.random() < 0.03 ? 511 : ship.heading;
  }
  if (Math.random() < 0.95) {
    posReport.NavigationalStatus = Math.random() < 0.03 ? 15 : ship.nav_status;
  }

  const payload = {
    MessageType: msgType,
    MetaData: {
      MMSI: ship.mmsi,
    },
    Message: {}
  };

  if (name !== undefined) {
    payload.MetaData.ShipName = name;
  }
  
  payload.Message[msgType] = posReport;
  return payload;
}

function buildAISStaticMessage(ship) {
  // Use persistent ship name status
  let name = ship.is_unknown_name ? ship.unknown_name_placeholder : ship.name;

  const staticReport = {};

  if (!ship.missing_destination && ship.destination) {
    staticReport.Destination = ship.destination;
  }
  
  if (!ship.missing_eta) {
    staticReport.Eta = {
      Month: 7,
      Day: 10,
      Hour: 12,
      Minute: 0
    };
  }

  if (!ship.missing_dimension) {
    staticReport.Dimension = {
      A: ship.type === 80 ? 200 : 150,
      B: 50
    };
  }

  if (!ship.missing_imo) {
    staticReport.ImoNumber = ship.imo;
  }

  if (!ship.missing_callsign && ship.callsign) {
    staticReport.CallSign = ship.callsign;
  }

  if (!ship.missing_type) {
    staticReport.Type = ship.type;
  }

  const payload = {
    MessageType: "ShipStaticData",
    MetaData: {
      MMSI: ship.mmsi,
    },
    Message: {
      ShipStaticData: staticReport
    }
  };

  if (name !== undefined) {
    payload.MetaData.ShipName = name;
  }

  return payload;
}

function buildAISAtoNMessage(ship) {
  const atonReport = {
    MessageID: 21,
    RepeatIndicator: 0,
    UserID: ship.mmsi,
    Valid: true,
    Type: ship.type || 20,
    Name: ship.name,
    PositionAccuracy: true,
    Longitude: ship.lon,
    Latitude: ship.lat,
    Dimension: {
      A: 5,
      B: 5,
      C: 2,
      D: 2
    },
    Fixtype: 1,
    Timestamp: Math.floor((Date.now() / 1000) % 60),
    OffPosition: false,
    AtoN: 0,
    Raim: true,
    VirtualAtoN: false,
    AssignedMode: false,
    Spare: false,
    NameExtension: ""
  };

  const payload = {
    MessageType: "AidsToNavigationReport",
    MetaData: {
      MMSI: ship.mmsi,
      ShipName: ship.name
    },
    Message: {
      AidsToNavigationReport: atonReport
    }
  };

  return payload;
}

function buildAISBaseStationMessage(ship) {
  const now = new Date();
  const baseStationReport = {
    MessageID: 4,
    RepeatIndicator: 0,
    UserID: ship.mmsi,
    Valid: true,
    UtcYear: now.getUTCFullYear(),
    UtcMonth: now.getUTCMonth() + 1,
    UtcDay: now.getUTCDate(),
    UtcHour: now.getUTCHours(),
    UtcMinute: now.getUTCMinutes(),
    UtcSecond: now.getUTCSeconds(),
    PositionAccuracy: true,
    Longitude: ship.lon,
    Latitude: ship.lat,
    FixType: 1,
    LongRangeEnable: true,
    Spare: 0,
    Raim: true,
    CommunicationState: 0
  };

  const payload = {
    MessageType: "BaseStationReport",
    MetaData: {
      MMSI: ship.mmsi,
      ShipName: ship.name
    },
    Message: {
      BaseStationReport: baseStationReport
    }
  };

  return payload;
}

// Physics & Drift Simulation Loop
let lastTickTime = Date.now();
let staticDataCounter = 0;

setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTickTime) / 1000 * simulationSpeed;
  lastTickTime = now;

  if (isPaused) return;

  // Move ships and increment their ticks_since_spawn
  ships.forEach(ship => {
    ship.ticks_since_spawn += dt;

    if (ship.sog > 0) {
      // Drift math: SOG is in knots (nautical miles per hour)
      // 1 knot = 1.852 km/h
      // Drift delta in degrees (very simplified approximation for local area):
      // 1 degree lat = ~60 nautical miles
      const speedInKnots = ship.sog;
      const speedInNauticalMilesPerSec = speedInKnots / 3600;
      const distanceMoved = speedInNauticalMilesPerSec * dt;

      const angleRad = (ship.cog * Math.PI) / 180;
      const dLat = distanceMoved * Math.cos(angleRad) / 60;
      const dLon = distanceMoved * Math.sin(angleRad) / (60 * Math.cos((ship.lat * Math.PI) / 180));

      ship.lat += dLat;
      ship.lon += dLon;

      // Random small adjustments to speed/course to look realistic
      if (Math.random() < 0.05) {
        ship.cog = (ship.cog + (Math.random() * 6 - 3) + 360) % 360;
        ship.heading = Math.round(ship.cog);
      }
      if (Math.random() < 0.03) {
        ship.sog = Math.max(2, Math.min(25, ship.sog + (Math.random() * 1 - 0.5)));
      }
    }

    // 0.2% chance per second for each ship to "retire" (sail away / cease transmission)
    // to simulate regular ship turnover (approx. 1 ship enters/leaves every 30 seconds for 15 ships at 1x speed)
    // static structures (AtoN, BaseStation) should never retire
    if (ship.vessel_class !== "AtoN" && ship.vessel_class !== "BaseStation") {
      const retireChance = 0.002 * dt;
      if (Math.random() < retireChance) {
        ship.is_retired = true;
      }
    }
  });

  // Filter out ships that have gone out of client bounding boxes, global map bounds, or are retired
  ships = ships.filter(ship => {
    // Static structures are permanent and should never be filtered out
    if (ship.vessel_class === "AtoN" || ship.vessel_class === "BaseStation") {
      return true;
    }

    if (ship.is_retired) {
      addLog('info', `Vessel ${ship.is_unknown_name ? 'Unknown' : ship.name} (MMSI: ${ship.mmsi}) left the simulation area.`);
      return false;
    }

    let needed = true;
    if (activeAISClients.size > 0) {
      needed = isShipNeededByAnyClient(ship);
    } else {
      const buffer = 0.05;
      needed = ship.lat >= MAP_BOUNDS.latMin - buffer &&
               ship.lat <= MAP_BOUNDS.latMax + buffer &&
               ship.lon >= MAP_BOUNDS.lonMin - buffer &&
               ship.lon <= MAP_BOUNDS.lonMax + buffer;
    }

    if (!needed) {
      addLog('info', `Vessel ${ship.is_unknown_name ? 'Unknown' : ship.name} (MMSI: ${ship.mmsi}) left the active client zones.`);
    }
    return needed;
  });

  // If target count decreased, trim the excess active vessels immediately
  if (ships.length > targetShipCount) {
    const excessCount = ships.length - targetShipCount;
    addLog('info', `Target vessel count reduced. Removing ${excessCount} excess vessels immediately.`);
    ships.splice(targetShipCount);
  }

  // Spawn new ships to maintain active ship count.
  // Batch spawns (increases > 1) are scattered across the map; single spawns start at boundaries.
  while (ships.length < targetShipCount) {
    const isBatchSpawn = (targetShipCount - ships.length) > 1;
    const newShip = spawnRandomShip(null, isBatchSpawn);
    ships.push(newShip);
    addLog('success', `New vessel entered simulation area: ${newShip.is_unknown_name ? 'Unknown Name' : newShip.name} (MMSI: ${newShip.mmsi})`);
  }

  // Send reports to client subscriptions (unless empty stream simulation is active)
  if (!emptyStreamActive) {
    activeAISClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && !client.pausedSimulation) {
        ships.forEach(ship => {
          // Check MMSI filter
          if (client.filtersShipMMSI && client.filtersShipMMSI.length > 0) {
            if (!client.filtersShipMMSI.includes(ship.mmsi.toString())) {
              return; // Skip this ship
            }
          }

          // Check coordinate bounds (if bounding boxes are defined)
          if (client.boundingBoxes && client.boundingBoxes.length > 0) {
            if (!isWithinBounds(ship.lat, ship.lon, client.boundingBoxes)) {
              return; // Skip this ship
            }
          }

          // Send message(s) depending on ship type and requested MessageTypes
          if (ship.vessel_class === "AtoN") {
            const msgType = "AidsToNavigationReport";
            if (matchesMessageType(client, msgType)) {
              const atonReport = buildAISAtoNMessage(ship);
              client.send(JSON.stringify(atonReport));
            }
          } else if (ship.vessel_class === "BaseStation") {
            const msgType = "BaseStationReport";
            if (matchesMessageType(client, msgType)) {
              const baseReport = buildAISBaseStationMessage(ship);
              client.send(JSON.stringify(baseReport));
            }
          } else {
            // Position Report
            const posMsgType = ship.vessel_class === "Class B" ? "StandardClassBPositionReport" : "PositionReport";
            if (matchesMessageType(client, posMsgType)) {
              const posReport = buildAISTelemetryMessage(ship);
              client.send(JSON.stringify(posReport));
            }

            // Ship Static Data Report
            const staticMsgType = "ShipStaticData";
            if (matchesMessageType(client, staticMsgType)) {
              // Send static report if delayed period is met, and periodically every 6 minutes (360s)
              if (ship.ticks_since_spawn >= ship.static_delay_ticks) {
                if (!client.sentStaticMMSIs) {
                  client.sentStaticMMSIs = new Set();
                }
                
                const ageSec = Math.floor(ship.ticks_since_spawn);
                const isPeriodic = (ageSec % 360) < Math.max(1, Math.floor(dt));
                const hasNotSentYet = !client.sentStaticMMSIs.has(ship.mmsi);
                
                if (hasNotSentYet || isPeriodic) {
                  const staticReport = buildAISStaticMessage(ship);
                  client.send(JSON.stringify(staticReport));
                  client.sentStaticMMSIs.add(ship.mmsi);
                }
              }
            }
          }
        });
      }
    });
  }

  broadcastState();
}, 1000);

// HTTP Server serving the dashboard
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getDashboardHTML());
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/v0/stream') {
    // AIS Stream endpoint
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleAISClientConnection(ws, request);
    });
  } else if (pathname === '/admin-ws') {
    // Administrative WebSocket
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleAdminClientConnection(ws);
    });
  } else {
    socket.destroy();
  }
});

// Client ID Counter
let nextClientId = 1;

function handleAISClientConnection(ws, request) {
  const clientId = nextClientId++;
  const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

  ws.clientId = clientId;
  ws.clientIp = clientIp;
  ws.connectedAt = new Date().toISOString();
  ws.boundingBoxes = [];
  ws.pausedSimulation = false;

  addLog('info', `New AIS Client connected (ID: ${clientId}, IP: ${clientIp})`);

  if (authErrorActive) {
    addLog('error', `Rejecting client ${clientId}: Force Authentication Failure is active.`);
    ws.send(JSON.stringify({
      Type: "Error",
      Message: "Authentication failed or rejected by server"
    }));
    setTimeout(() => {
      ws.close(1008, "Auth Failed");
    }, 500);
    return;
  }

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message.toString());
      const apiKey = payload.APIKey || payload.ApiKey || payload.apikey;
      const boundingBoxes = payload.BoundingBoxes || payload.boundingBoxes || payload.boundingboxes;
      const filtersShipMMSI = payload.FiltersShipMMSI || payload.FiltersShipMmsi || payload.filtersShipMmsi || payload.FiltersByMMSI || payload.filtersByMmsi;
      const filterMessageTypes = payload.FilterMessageTypes || payload.filterMessageTypes || payload.filtermessagetypes;

      if (apiKey && (boundingBoxes || filtersShipMMSI)) {
        ws.boundingBoxes = normalizeBoundingBoxes(boundingBoxes);
        ws.filtersShipMMSI = Array.isArray(filtersShipMMSI) ? filtersShipMMSI.map(m => m.toString()) : [];
        ws.filterMessageTypes = Array.isArray(filterMessageTypes) ? filterMessageTypes : [];

        let successMsg = `Client ${clientId} subscribed.`;
        if (ws.boundingBoxes.length > 0) {
          successMsg += ` Bounding Boxes: ${JSON.stringify(ws.boundingBoxes)}`;
        }
        if (ws.filtersShipMMSI.length > 0) {
          successMsg += ` Filters MMSI: ${JSON.stringify(ws.filtersShipMMSI)}`;
        }
        if (ws.filterMessageTypes.length > 0) {
          successMsg += ` Filters MsgTypes: ${JSON.stringify(ws.filterMessageTypes)}`;
        }
        addLog('success', successMsg);

        // Dynamically re-seed simulated ships to be inside client's bounding boxes if they aren't
        if (ws.boundingBoxes.length > 0) {
          ships.forEach((ship, idx) => {
            if (!isWithinBounds(ship.lat, ship.lon, ws.boundingBoxes)) {
              // Pick a bounding box at random to scatter the ship in
              const box = ws.boundingBoxes[idx % ws.boundingBoxes.length];
              if (Array.isArray(box) && box.length === 2) {
                const [p1, p2] = box;
                const minLat = Math.min(p1[0], p2[0]);
                const maxLat = Math.max(p1[0], p2[0]);
                const minLon = Math.min(p1[1], p2[1]);
                const maxLon = Math.max(p1[1], p2[1]);

                // Scatter it within this box
                ship.lat = minLat + (maxLat - minLat) * (0.15 + 0.7 * Math.random());
                ship.lon = minLon + (maxLon - minLon) * (0.15 + 0.7 * Math.random());
                
                // Clear current SOG if it's Ever Given or static structures
                if (ship.mmsi !== 311000523 && ship.vessel_class !== "AtoN" && ship.vessel_class !== "BaseStation") {
                  ship.sog = 10 + (idx % 8);
                }
              }
            }
          });

          // Adjust MAP_BOUNDS to frame ALL bounding boxes combined
          let minLat = Infinity, maxLat = -Infinity;
          let minLon = Infinity, maxLon = -Infinity;
          let validBoxes = 0;

          ws.boundingBoxes.forEach(box => {
            if (Array.isArray(box) && box.length === 2) {
              const [p1, p2] = box;
              minLat = Math.min(minLat, p1[0], p2[0]);
              maxLat = Math.max(maxLat, p1[0], p2[0]);
              minLon = Math.min(minLon, p1[1], p2[1]);
              maxLon = Math.max(maxLon, p1[1], p2[1]);
              validBoxes++;
            }
          });

          if (validBoxes > 0) {
            MAP_BOUNDS = {
              latMin: minLat - 0.02,
              latMax: maxLat + 0.02,
              lonMin: minLon - 0.02,
              lonMax: maxLon + 0.02
            };
            addLog('info', `Dashboard map reframed around all ${validBoxes} client bounding boxes.`);
          }
        }

        activeAISClients.add(ws);
        broadcastState();
      } else {
        addLog('warning', `Client ${clientId} sent invalid subscription: ${message.toString()}`);
      }
    } catch (e) {
      addLog('error', `Failed to parse message from Client ${clientId}: ${e.message}`);
    }
  });

  ws.on('close', (code, reason) => {
    activeAISClients.delete(ws);
    addLog('warning', `Client ${clientId} disconnected. Code: ${code}, Reason: ${reason || 'None'}`);
    broadcastState();
  });

  ws.on('error', (err) => {
    addLog('error', `Client ${clientId} error: ${err.message}`);
  });
}

function handleAdminClientConnection(ws) {
  adminClients.add(ws);

  // Send initial state & logs
  ws.send(JSON.stringify({ event: 'state', data: { isPaused, simulationSpeed, targetShipCount, authErrorActive, emptyStreamActive, MAP_BOUNDS, ships, activeConnections: Array.from(activeAISClients).map(c => ({ id: c.clientId, ip: c.clientIp, connectedAt: c.connectedAt, boundingBoxes: c.boundingBoxes })) } }));
  ws.send(JSON.stringify({ event: 'logs', data: logHistory }));

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message.toString());
      const { action, data } = payload;

      switch (action) {
        case 'toggle_pause':
          isPaused = !isPaused;
          addLog('info', `Simulation ${isPaused ? 'PAUSED' : 'RESUMED'}`);
          break;
        case 'set_speed':
          simulationSpeed = parseFloat(data.speed) || 1;
          addLog('info', `Simulation speed set to ${simulationSpeed}x`);
          break;
        case 'set_vessel_count':
          targetShipCount = parseInt(data.count) || 15;
          addLog('info', `Target vessel count set to ${targetShipCount}`);
          break;
        case 'toggle_auth_error':
          authErrorActive = !authErrorActive;
          addLog('info', `Force Authentication Error: ${authErrorActive ? 'ENABLED' : 'DISABLED'}`);
          if (authErrorActive) {
            addLog('warning', `Dropping all active AIS clients due to Force Authentication Error...`);
            activeAISClients.forEach(client => {
              try {
                client.send(JSON.stringify({
                  Type: "Error",
                  Message: "Authentication failed or rejected by server"
                }));
                setTimeout(() => {
                  try { client.close(1008, "Auth Failed"); } catch (e) {}
                }, 100);
              } catch (e) {}
            });
            activeAISClients.clear();
          }
          break;
        case 'toggle_empty_stream':
          emptyStreamActive = !emptyStreamActive;
          addLog('info', `Empty Stream Simulation: ${emptyStreamActive ? 'ENABLED' : 'DISABLED'}`);
          break;
        case 'disconnect_clients':
          const code = parseInt(data.code) || 1006;
          const reason = data.reason || 'Simulation Drop';
          addLog('warning', `Dropping all active AIS clients with Code: ${code}, Reason: ${reason}`);
          activeAISClients.forEach(client => {
            try {
              if (code === 1006) {
                client.terminate();
              } else {
                client.close(code, reason);
              }
            } catch (e) {}
          });
          activeAISClients.clear();
          break;
        case 'inject_ship':
          const customShip = {
            mmsi: parseInt(data.mmsi) || Math.floor(Math.random() * 900000000) + 100000000,
            name: (data.name || "UNNAMED INJECTED").toUpperCase(),
            type: parseInt(data.type) || 70,
            vessel_class: data.vessel_class || "Class A",
            lat: parseFloat(data.lat) || 1.30,
            lon: parseFloat(data.lon) || 103.85,
            sog: parseFloat(data.sog) || 12.0,
            cog: parseFloat(data.cog) || 90.0,
            heading: parseInt(data.heading) || 90,
            nav_status: parseInt(data.nav_status) || 0,
            destination: (data.destination || "INJECTION").toUpperCase(),
            imo: parseInt(data.imo) || 0,
            callsign: (data.callsign || "INJECT").toUpperCase()
          };
          initializeShipProperties(customShip, true);
          ships.push(customShip);
          addLog('success', `Injected new vessel: ${customShip.name} (MMSI: ${customShip.mmsi})`);
          
          // Force immediate packet send of telemetry & static data
          activeAISClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && isWithinBounds(customShip.lat, customShip.lon, client.boundingBoxes)) {
              client.send(JSON.stringify(buildAISTelemetryMessage(customShip)));
              client.send(JSON.stringify(buildAISStaticMessage(customShip)));
              if (!client.sentStaticMMSIs) {
                client.sentStaticMMSIs = new Set();
              }
              client.sentStaticMMSIs.add(customShip.mmsi);
            }
          });
          break;
        case 'remove_ship':
          ships = ships.filter(s => s.mmsi !== parseInt(data.mmsi));
          addLog('info', `Removed vessel MMSI: ${data.mmsi}`);
          break;
      }
      broadcastState();
    } catch (e) {
      console.error("Admin WS error handling action:", e);
    }
  });

  ws.on('close', () => {
    adminClients.delete(ws);
  });
}

// Premium visual admin dashboard markup
function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AISStream Simulator Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg: #0a0e17;
      --card-bg: rgba(20, 27, 45, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --primary: #00f0ff;
      --primary-glow: rgba(0, 240, 255, 0.3);
      --success: #00ff66;
      --warning: #ffaa00;
      --danger: #ff0055;
      --text: #e2e8f0;
      --text-muted: #64748b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      min-height: 100vh;
      background-image: 
        radial-gradient(at 10% 20%, rgba(0, 240, 255, 0.05) 0px, transparent 50%),
        radial-gradient(at 90% 80%, rgba(255, 0, 85, 0.03) 0px, transparent 50%);
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    header h1 {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    header h1 span {
      background: linear-gradient(135deg, var(--primary), var(--success));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 99px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-status {
      background: rgba(0, 240, 255, 0.1);
      border: 1px solid var(--primary);
      color: var(--primary);
      box-shadow: 0 0 10px var(--primary-glow);
    }

    .badge-paused {
      background: rgba(255, 170, 0, 0.1);
      border: 1px solid var(--warning);
      color: var(--warning);
    }

    main {
      max-width: 1400px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 1024px) {
      main {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 600;
      border-left: 3px solid var(--primary);
      padding-left: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .control-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    button {
      font-family: inherit;
      font-weight: 600;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: var(--primary);
      color: #000;
    }

    .btn-primary:hover {
      box-shadow: 0 0 15px var(--primary);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.12);
    }

    .btn-danger {
      background: var(--danger);
      color: #fff;
    }

    .btn-danger:hover {
      box-shadow: 0 0 15px rgba(255, 0, 85, 0.4);
      transform: translateY(-1px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input, select {
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    input:focus, select:focus {
      border-color: var(--primary);
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    /* Map Visualizer */
    .radar-container {
      position: relative;
      border-radius: 12px;
      border: 1px solid var(--border);
      aspect-ratio: 16/10;
      overflow: hidden;
    }

    #map {
      width: 100%;
      height: 100%;
      background: #04070d;
      z-index: 10;
    }

    /* Custom SVG Ship Marker Rotation style */
    .ship-icon {
      transition: transform 0.2s linear;
    }

    /* Connections and Vessels list */
    .client-list, .vessel-list {
      max-height: 220px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-right: 0.25rem;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.8rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .list-item-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .list-item-name {
      font-weight: 600;
      color: var(--primary);
    }

    .list-item-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Terminal Console */
    .console {
      background: #020408;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .log-line {
      line-height: 1.4;
      display: flex;
      gap: 0.5rem;
    }

    .log-time {
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .log-type {
      font-weight: bold;
      text-transform: uppercase;
      flex-shrink: 0;
      width: 65px;
    }

    .log-info { color: #00aaff; }
    .log-success { color: var(--success); }
    .log-warning { color: var(--warning); }
    .log-error { color: var(--danger); }
    .log-msg {
      word-break: break-all;
    }

    .active-toggle {
      border: 1px solid var(--primary) !important;
      background: rgba(0, 240, 255, 0.15) !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
    }

    .active-danger-toggle {
      border: 1px solid var(--danger) !important;
      background: rgba(255, 0, 85, 0.15) !important;
      box-shadow: 0 0 10px rgba(255, 0, 85, 0.2);
    }

    /* Speed Slider styling */
    .speed-slider-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .speed-slider-container input[type=range] {
      flex: 1;
      accent-color: var(--primary);
    }

    .speed-val {
      font-weight: bold;
      width: 40px;
      text-align: right;
      color: var(--primary);
    }

    /* Collapsible vessel list panel styles */
    .vessel-detail-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 0.25rem;
      margin-top: 0.5rem;
    }

    .vessel-row {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: rgba(255,255,255,0.01);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .vessel-row:hover {
      border-color: rgba(0, 240, 255, 0.25);
      background: rgba(255,255,255,0.02);
    }

    .vessel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 0.9rem;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
    }

    .vessel-header:hover {
      background: rgba(255,255,255,0.03);
    }

    .vessel-header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .vessel-badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-class-a {
      background: rgba(0, 240, 255, 0.1);
      color: var(--primary);
      border: 1px solid rgba(0, 240, 255, 0.2);
    }

    .badge-class-b {
      background: rgba(0, 255, 102, 0.1);
      color: var(--success);
      border: 1px solid rgba(0, 255, 102, 0.2);
    }

    .vessel-header-meta {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .vessel-name-title {
      font-weight: 600;
      color: #fff;
      font-size: 0.85rem;
    }

    .vessel-mmsi-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .chevron-icon {
      transition: transform 0.2s ease;
      color: var(--text-muted);
      display: inline-block;
      width: 16px;
      height: 16px;
      line-height: 16px;
      text-align: center;
      font-weight: bold;
    }

    .vessel-row.expanded {
      border-color: rgba(0, 240, 255, 0.4);
      background: rgba(0, 0, 0, 0.2);
    }

    .vessel-row.expanded .chevron-icon {
      transform: rotate(180deg);
      color: var(--primary);
    }

    .vessel-details-container {
      display: none;
      padding: 0.9rem;
      border-top: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.25);
    }

    .vessel-row.expanded .vessel-details-container {
      display: block;
    }

    .vessel-details-section-title {
      font-size: 0.7rem;
      color: var(--primary);
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid rgba(0, 240, 255, 0.1);
      padding-bottom: 0.2rem;
    }

    .vessel-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }

    .vessel-details-grid:last-child {
      margin-bottom: 0;
    }

    .metric-group {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .metric-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .metric-value {
      font-size: 0.8rem;
      font-weight: 500;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
    }

    .metric-value.null-value {
      color: var(--danger);
      font-style: italic;
    }
  </style>
</head>
<body>
  <header>
    <h1>AISStream <span>Simulator</span></h1>
    <div id="sim-badge" class="badge badge-status">Active</div>
  </header>

  <main>
    <!-- Left Column: Controls & Configuration -->
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div class="panel">
        <div class="panel-title">Global Controls</div>
        <div class="control-row">
          <button id="btn-pause" class="btn-primary">Pause Simulation</button>
          <button id="btn-auth-err" class="btn-secondary">Simulate Auth Error</button>
          <button id="btn-empty-stream" class="btn-secondary">Simulate Empty Stream</button>
        </div>
        <div class="speed-slider-container">
          <label style="width: 150px; display: inline-block;">Drift Speed Multiplier</label>
          <input type="range" id="speed-range" min="0" max="10" step="1" value="1">
          <span class="speed-val" id="speed-val" style="width: 60px;">1x</span>
        </div>
        <div class="speed-slider-container">
          <label style="width: 150px; display: inline-block;">Target Vessel Count</label>
          <input type="range" id="vessels-range" min="5" max="100" step="5" value="15">
          <span class="speed-val" id="vessels-val" style="width: 60px;">15</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Fault & Disconnect Injector</div>
        <div class="control-row" style="align-items: flex-end;">
          <div class="form-group" style="flex: 1;">
            <label for="close-code">Close Code</label>
            <select id="close-code">
              <option value="1006">1006 (Abrupt / Protocol Error)</option>
              <option value="1000">1000 (Normal Closure)</option>
              <option value="1008">1008 (Policy Violation / Rate Limit)</option>
            </select>
          </div>
          <button id="btn-drop" class="btn-danger">Drop Active Clients</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Inject Custom Ship Report</div>
        <form id="inject-form">
          <div class="grid-2">
            <div class="form-group">
              <label for="ship-name">Vessel Name</label>
              <input type="text" id="ship-name" placeholder="E.g., TUG ADVENTURE" required>
            </div>
            <div class="form-group">
              <label for="ship-mmsi">MMSI</label>
              <input type="number" id="ship-mmsi" placeholder="9-digit number" required>
            </div>
          </div>
          <div class="grid-3" style="margin-top: 1rem;">
            <div class="form-group">
              <label for="ship-lat">Latitude</label>
              <input type="number" id="ship-lat" step="0.0001" min="1.1" max="1.5" value="1.30" required>
            </div>
            <div class="form-group">
              <label for="ship-lon">Longitude</label>
              <input type="number" id="ship-lon" step="0.0001" min="103.5" max="104.2" value="103.85" required>
            </div>
            <div class="form-group">
              <label for="ship-class">Class</label>
              <select id="ship-class">
                <option value="Class A">Class A (PositionReport)</option>
                <option value="Class B">Class B (StandardClassB)</option>
              </select>
            </div>
          </div>
          <div class="grid-3" style="margin-top: 1rem;">
            <div class="form-group">
              <label for="ship-sog">SOG (Knots)</label>
              <input type="number" id="ship-sog" step="0.1" value="12.0">
            </div>
            <div class="form-group">
              <label for="ship-cog">COG (Degrees)</label>
              <input type="number" id="ship-cog" min="0" max="360" value="90">
            </div>
            <div class="form-group">
              <label for="ship-type">Vessel Type Code</label>
              <input type="number" id="ship-type" value="70">
            </div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 1.25rem; width: 100%; justify-content: center;">Inject & Broadcast Vessel</button>
        </form>
      </div>
    </div>

    <!-- Right Column: Map, Clients & Logging -->
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div class="panel">
        <div class="panel-title">Interactive Map Visualizer</div>
        <div class="radar-container">
          <div id="map"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Simulated Vessels Telemetry & Details (<span id="vessel-count">0</span>)</div>
        <div class="vessel-detail-list" id="vessel-detail-list">
          <div class="list-item" style="color: var(--text-muted); justify-content: center; border-style: dashed;">
            No simulated vessels active
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Active AIS Client Connections (<span id="client-count">0</span>)</div>
        <div class="client-list" id="client-list">
          <div class="list-item" style="color: var(--text-muted); justify-content: center; border-style: dashed;">
            No active clients connected
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Event Log</div>
        <div class="console" id="console"></div>
      </div>
    </div>
  </main>

  <script>
    const ws = new WebSocket('ws://' + window.location.host + '/admin-ws');

    const consoleDiv = document.getElementById('console');
    const clientListDiv = document.getElementById('client-list');
    const clientCountSpan = document.getElementById('client-count');
    const vesselDetailListDiv = document.getElementById('vessel-detail-list');
    const vesselCountSpan = document.getElementById('vessel-count');
    
    const expandedVessels = new Set();

    window.toggleVesselExpand = function(mmsi) {
      if (expandedVessels.has(mmsi)) {
        expandedVessels.delete(mmsi);
      } else {
        expandedVessels.add(mmsi);
      }
      updateUI();
    };

    const btnPause = document.getElementById('btn-pause');
    const btnAuthErr = document.getElementById('btn-auth-err');
    const btnEmptyStream = document.getElementById('btn-empty-stream');
    const btnDrop = document.getElementById('btn-drop');
    const closeCodeSelect = document.getElementById('close-code');
    const speedRange = document.getElementById('speed-range');
    const speedVal = document.getElementById('speed-val');
    const vesselsRange = document.getElementById('vessels-range');
    const vesselsVal = document.getElementById('vessels-val');
    const simBadge = document.getElementById('sim-badge');

    let simulationData = {
      isPaused: false,
      simulationSpeed: 1,
      targetShipCount: 15,
      authErrorActive: false,
      emptyStreamActive: false,
      MAP_BOUNDS: { latMin: 1.13, latMax: 1.47, lonMin: 103.58, lonMax: 104.18 },
      ships: [],
      activeConnections: []
    };

    const NAV_STATUS_MAP = {
      0: "Underway using engine",
      1: "At anchor",
      5: "Moored",
      15: "Not defined"
    };
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([1.25, 103.82], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    let boundsRectangles = [];
    let shipMarkers = {};
    let lastBoundsStr = "";

    function drawMapEntities() {
      // 1. Draw Active Client Bounding Box Subscriptions
      boundsRectangles.forEach(rect => map.removeLayer(rect));
      boundsRectangles = [];

      let hasActiveBoxes = false;
      simulationData.activeConnections.forEach(conn => {
        if (conn.boundingBoxes && conn.boundingBoxes.length > 0) {
          hasActiveBoxes = true;
          conn.boundingBoxes.forEach(box => {
            if (box.length === 2) {
              const r = L.rectangle([[box[0][0], box[0][1]], [box[1][0], box[1][1]]], {
                color: '#00ff66',
                weight: 1.5,
                fillOpacity: 0.03,
                dashArray: '4, 6'
              }).addTo(map);
              boundsRectangles.push(r);
            }
          });
        }
      });

      // If no client subscriptions with coordinates exist, draw the default simulator area boundary
      if (!hasActiveBoxes && simulationData.MAP_BOUNDS) {
        const bounds = simulationData.MAP_BOUNDS;
        const r = L.rectangle([[bounds.latMin, bounds.lonMin], [bounds.latMax, bounds.lonMax]], {
          color: '#00f0ff', // Neon blue for the simulator boundaries
          weight: 1.5,
          fillOpacity: 0.01,
          dashArray: '5, 8'
        }).addTo(map);
        boundsRectangles.push(r);
      }

      // 2. Clear Markers of ships no longer in simulation
      const currentMmsis = new Set(simulationData.ships.map(s => s.mmsi));
      for (const mmsi in shipMarkers) {
        if (!currentMmsis.has(parseInt(mmsi))) {
          map.removeLayer(shipMarkers[mmsi]);
          delete shipMarkers[mmsi];
        }
      }

      // 3. Draw/Update Vessels
      simulationData.ships.forEach(ship => {
        const rotation = ship.cog || 0;
        
        // Dims ships to 15% opacity when the stream is simulated empty to show they are muted
        const opacity = simulationData.emptyStreamActive ? 0.15 : 1.0;
        
        let color = "#00f0ff"; // default Class A
        if (ship.vessel_class === "Class B") {
          color = "#00ff66";
        } else if (ship.vessel_class === "AtoN") {
          color = "#ffaa00";
        } else if (ship.vessel_class === "BaseStation") {
          color = "#ffffff";
        }

        let svgHtml = "";
        if (ship.vessel_class === "AtoN") {
          svgHtml = \`
            <svg class="ship-icon" width="20" height="20" viewBox="0 0 24 24" style="overflow: visible;">
              <polygon points="12,2 22,12 12,22 2,12" fill="\${color}" opacity="\${opacity}"/>
              <circle cx="12" cy="12" r="3" fill="#000" opacity="\${opacity}"/>
            </svg>
          \`;
        } else if (ship.vessel_class === "BaseStation") {
          svgHtml = \`
            <svg class="ship-icon" width="20" height="20" viewBox="0 0 24 24" style="overflow: visible;">
              <circle cx="12" cy="12" r="8" stroke="\${color}" stroke-width="2" fill="none" opacity="\${opacity}"/>
              <line x1="12" y1="4" x2="12" y2="20" stroke="\${color}" stroke-width="2" opacity="\${opacity}"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="\${color}" stroke-width="2" opacity="\${opacity}"/>
              <circle cx="12" cy="12" r="2.5" fill="\${color}" opacity="\${opacity}"/>
            </svg>
          \`;
        } else {
          svgHtml = \`
            <svg class="ship-icon" width="20" height="20" viewBox="0 0 24 24" style="transform: rotate(\${rotation}deg); overflow: visible;">
              <path d="M12,2L16,10L13,9L12,24L11,9L8,10Z" fill="\${color}" opacity="\${opacity}"/>
              <circle cx="12" cy="12" r="3.5" fill="#fff" opacity="\${opacity}"/>
            </svg>
          \`;
        }

        const icon = L.divIcon({
          html: svgHtml,
          className: 'custom-ship-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        let labelText = "";
        if (ship.vessel_class === "AtoN") {
          labelText = \`
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.8rem; line-height: 1.3;">
              <strong style="color: \${color};">\${ship.name}</strong><br/>
              MMSI (AtoN): \${ship.mmsi}<br/>
              Type: Aids to Navigation (\${ship.type})<br/>
              Position: \${ship.lat.toFixed(4)}, \${ship.lon.toFixed(4)}
            </div>
          \`;
        } else if (ship.vessel_class === "BaseStation") {
          labelText = \`
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.8rem; line-height: 1.3;">
              <strong style="color: \${color};">\${ship.name}</strong><br/>
              MMSI (Base Station): \${ship.mmsi}<br/>
              Position: \${ship.lat.toFixed(4)}, \${ship.lon.toFixed(4)}
            </div>
          \`;
        } else {
          const statusStr = NAV_STATUS_MAP[ship.nav_status] || "Unknown";
          labelText = \`
            <div style="font-family: 'Outfit', sans-serif; font-size: 0.8rem; line-height: 1.3;">
              <strong style="color: \${color};">\${ship.name}</strong><br/>
              MMSI: \${ship.mmsi}<br/>
              Speed: \${ship.sog} kn | Heading: \${ship.heading}°<br/>
              Status: \${statusStr}
            </div>
          \`;
        }

        if (shipMarkers[ship.mmsi]) {
          shipMarkers[ship.mmsi].setLatLng([ship.lat, ship.lon]);
          shipMarkers[ship.mmsi].setIcon(icon);
          shipMarkers[ship.mmsi].setTooltipContent(labelText);
        } else {
          const marker = L.marker([ship.lat, ship.lon], { icon: icon })
            .addTo(map)
            .bindTooltip(labelText, { permanent: false, direction: 'top', className: 'map-tooltip' });
          shipMarkers[ship.mmsi] = marker;
        }
      });
    }

    // WebSocket Admin client messages
    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      if (packet.event === 'state') {
        simulationData = packet.data;
        const newBoundsStr = JSON.stringify(simulationData.MAP_BOUNDS);
        if (newBoundsStr !== lastBoundsStr && simulationData.MAP_BOUNDS) {
          lastBoundsStr = newBoundsStr;
          map.fitBounds([
            [simulationData.MAP_BOUNDS.latMin, simulationData.MAP_BOUNDS.lonMin],
            [simulationData.MAP_BOUNDS.latMax, simulationData.MAP_BOUNDS.lonMax]
          ]);
        }
        drawMapEntities();
        updateUI();
      } else if (packet.event === 'logs') {
        packet.data.forEach(log => appendLogLine(log));
      } else if (packet.event === 'log') {
        appendLogLine(packet.data);
      }
    };

    function updateUI() {
      // Pause button state
      if (simulationData.isPaused) {
        btnPause.innerText = "Resume Simulation";
        btnPause.className = "btn-secondary";
        simBadge.innerText = "Paused";
        simBadge.className = "badge badge-paused";
      } else {
        btnPause.innerText = "Pause Simulation";
        btnPause.className = "btn-primary";
        simBadge.innerText = "Active";
        simBadge.className = "badge badge-status";
      }

      // Auth Error state
      if (simulationData.authErrorActive) {
        btnAuthErr.className = "btn-secondary active-danger-toggle";
        btnAuthErr.innerText = "Force Auth Error: ON";
      } else {
        btnAuthErr.className = "btn-secondary";
        btnAuthErr.innerText = "Simulate Auth Error";
      }

      // Empty Stream state
      if (simulationData.emptyStreamActive) {
        btnEmptyStream.className = "btn-secondary active-danger-toggle";
        btnEmptyStream.innerText = "Empty Stream: ON";
      } else {
        btnEmptyStream.className = "btn-secondary";
        btnEmptyStream.innerText = "Simulate Empty Stream";
      }
      // Speed slider
      speedRange.value = simulationData.simulationSpeed;
      speedVal.innerText = simulationData.simulationSpeed + 'x';

      // Vessels slider
      vesselsRange.value = simulationData.targetShipCount;
      vesselsVal.innerText = simulationData.targetShipCount;

      // Vessel list
      const sortedShips = [...simulationData.ships].sort((a, b) => b.mmsi - a.mmsi);
      vesselCountSpan.innerText = sortedShips.length;
      if (sortedShips.length === 0) {
        vesselDetailListDiv.innerHTML = \`<div class="list-item" style="color: var(--text-muted); justify-content: center; border-style: dashed;">No simulated vessels active</div>\`;
      } else {
        vesselDetailListDiv.innerHTML = sortedShips.map(ship => {
          const isExpanded = expandedVessels.has(ship.mmsi);
          const expandedClass = isExpanded ? 'expanded' : '';
          const badgeClass = ship.vessel_class === 'Class B' ? 'badge-class-b' : 'badge-class-a';
          
          // Format metrics
          const latStr = ship.lat !== undefined && ship.lat !== null ? ship.lat.toFixed(6) : 'N/A';
          const lonStr = ship.lon !== undefined && ship.lon !== null ? ship.lon.toFixed(6) : 'N/A';
          const sogStr = ship.sog !== undefined && ship.sog !== null ? (typeof ship.sog === 'number' ? ship.sog.toFixed(2) : ship.sog) + ' kn' : 'N/A';
          const cogStr = ship.cog !== undefined && ship.cog !== null ? (typeof ship.cog === 'number' ? ship.cog.toFixed(2) : ship.cog) + '°' : 'N/A';
          const headingStr = ship.heading !== undefined && ship.heading !== null ? ship.heading + '°' : 'N/A';
          const navStatusStr = (ship.nav_status !== undefined && ship.nav_status !== null) ? (NAV_STATUS_MAP[ship.nav_status] || 'Unknown (' + ship.nav_status + ')') : 'N/A';
          const dimAStr = ship.type === 80 ? '200m' : '150m';

          return \`
            <div class="vessel-row \${expandedClass}" data-mmsi="\${ship.mmsi}">
              <div class="vessel-header" onclick="toggleVesselExpand(\${ship.mmsi})">
                <div class="vessel-header-info">
                  <span class="vessel-badge \${badgeClass}">\${ship.vessel_class || 'Class A'}</span>
                  <div class="vessel-header-meta">
                    <span class="vessel-name-title">\${ship.name || 'Unknown Ship'}</span>
                    <span class="vessel-mmsi-sub">MMSI: \${ship.mmsi}</span>
                  </div>
                </div>
                <span class="chevron-icon">▼</span>
              </div>
              <div class="vessel-details-container">
                <div class="vessel-details-section-title">Telemetry / Position Report</div>
                <div class="vessel-details-grid">
                  <div class="metric-group">
                    <span class="metric-label">Latitude</span>
                    <span class="metric-value">\${latStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Longitude</span>
                    <span class="metric-value">\${lonStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Speed (SOG)</span>
                    <span class="metric-value">\${sogStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Course (COG)</span>
                    <span class="metric-value">\${cogStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Heading</span>
                    <span class="metric-value">\${headingStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Navigational Status</span>
                    <span class="metric-value">\${navStatusStr}</span>
                  </div>
                </div>
                
                <div class="vessel-details-section-title">Vessel Static Data</div>
                <div class="vessel-details-grid">
                  <div class="metric-group">
                    <span class="metric-label">Destination</span>
                    <span class="metric-value">\${ship.destination || 'N/A'}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">ETA</span>
                    <span class="metric-value">10/07 12:00 UTC</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Dimension A (Bow)</span>
                    <span class="metric-value">\${dimAStr}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Dimension B (Stern)</span>
                    <span class="metric-value">50m</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">IMO Number</span>
                    <span class="metric-value">\${ship.imo || 'N/A'}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Call Sign</span>
                    <span class="metric-value">\${ship.callsign || 'N/A'}</span>
                  </div>
                  <div class="metric-group">
                    <span class="metric-label">Vessel Type</span>
                    <span class="metric-value">\${ship.type}</span>
                  </div>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // Client list
      clientCountSpan.innerText = simulationData.activeConnections.length;
      if (simulationData.activeConnections.length === 0) {
        clientListDiv.innerHTML = \`<div class="list-item" style="color: var(--text-muted); justify-content: center; border-style: dashed;">No active clients connected</div>\`;
      } else {
        clientListDiv.innerHTML = simulationData.activeConnections.map(c => \`
          <div class="list-item">
            <div class="list-item-meta">
              <span class="list-item-name">Client ID: \${c.id}</span>
              <span class="list-item-sub">IP: \${c.ip}</span>
            </div>
            <div style="text-align: right;">
              <span class="badge" style="background: rgba(0,255,102,0.1); color: var(--success); font-size: 0.65rem;">CONNECTED</span>
              <div class="list-item-sub" style="font-size: 0.65rem; margin-top: 0.2rem;">\${c.boundingBoxes.length} Sub Bounds</div>
            </div>
          </div>
        \`).join('');
      }
    }

    function appendLogLine(log) {
      const line = document.createElement('div');
      line.className = 'log-line';
      const time = document.createElement('span');
      time.className = 'log-time';
      time.innerText = log.timestamp.split('T')[1].substring(0, 8);

      const type = document.createElement('span');
      type.className = 'log-type log-' + log.type;
      type.innerText = log.type;

      const msg = document.createElement('span');
      msg.className = 'log-msg';
      msg.innerText = log.message;

      line.appendChild(time);
      line.appendChild(type);
      line.appendChild(msg);

      consoleDiv.appendChild(line);
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }

    // Action handlers
    btnPause.onclick = () => {
      ws.send(JSON.stringify({ action: 'toggle_pause' }));
    };

    btnAuthErr.onclick = () => {
      ws.send(JSON.stringify({ action: 'toggle_auth_error' }));
    };

    btnEmptyStream.onclick = () => {
      ws.send(JSON.stringify({ action: 'toggle_empty_stream' }));
    };

    btnDrop.onclick = () => {
      ws.send(JSON.stringify({ 
        action: 'disconnect_clients', 
        data: { 
          code: closeCodeSelect.value,
          reason: 'Admin triggered close'
        } 
      }));
    };

    speedRange.oninput = () => {
      ws.send(JSON.stringify({
        action: 'set_speed',
        data: { speed: speedRange.value }
      }));
    };

    vesselsRange.oninput = () => {
      ws.send(JSON.stringify({
        action: 'set_vessel_count',
        data: { count: vesselsRange.value }
      }));
    };

    // Inject Form
    document.getElementById('inject-form').onsubmit = (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('ship-name').value,
        mmsi: document.getElementById('ship-mmsi').value,
        lat: document.getElementById('ship-lat').value,
        lon: document.getElementById('ship-lon').value,
        vessel_class: document.getElementById('ship-class').value,
        sog: document.getElementById('ship-sog').value,
        cog: document.getElementById('ship-cog').value,
        type: document.getElementById('ship-type').value
      };

      ws.send(JSON.stringify({
        action: 'inject_ship',
        data: payload
      }));

      // reset form a bit
      document.getElementById('ship-name').value = '';
      document.getElementById('ship-mmsi').value = '';
    };
  </script>
</body>
</html>`;
}

// Start Server
server.listen(PORT, () => {
  addLog('success', `AISStream Simulator dashboard is running at http://localhost:${PORT}`);
  addLog('info', `WS subscription endpoint ready at ws://localhost:${PORT}/v0/stream`);
});
