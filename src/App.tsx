import React, { useState, useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Tooltip,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"
import L, { LatLngTuple } from "leaflet"
import * as turf from "@turf/turf"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom Icon Generator with Built-in Text Label below the Icon
const createLandmarkLabelIcon = (
  emoji: string,
  name: string,
  distKm: number,
  color: string
) => {
  return L.divIcon({
    className: "custom-landmark-label-pin",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 140px; transform: translateX(-50%);">
        <!-- ICON BUBBLE -->
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          z-index: 2;
        ">${emoji}</div>
        
        <!-- TEXT LABEL BELOW ICON -->
        <div style="
          background: rgba(15, 23, 42, 0.85);
          color: white;
          padding: 3px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          margin-top: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          <div>${name}</div>
          <div style="color: #f97316; font-size: 9px;">📍 ${distKm} km</div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 16],
  })
}

function RecenterMap({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

interface Landmark {
  id: string
  type: string
  emoji: string
  name: string
  distKm: number
  coords: LatLngTuple
  color: string
}

// --- DUMMY PROPERTY DATABASE WITH SPECIFIC LANDMARK NAMES ---
const PROPERTIES_DATABASE = [
  {
    id: "LOT-1001",
    name: "VMUF Central Prime Lot",
    address: "Tirona Hwy, Bacoor, Cavite",
    pricePhp: 15500000,
    status: "For Sale",
    agent: "Bacoor Realty Partners",
    centerCoords: [14.4506, 120.9828] as LatLngTuple,
    boundaryPolygon: [
      [14.4515, 120.9815],
      [14.4515, 120.9825],
      [14.45, 120.9825],
      [14.45, 120.9815],
    ] as LatLngTuple[],
    frontageLine: [
      [14.4515, 120.9815],
      [14.4515, 120.9825],
    ] as LatLngTuple[],
    landmarks: [
      {
        id: "h1",
        type: "Hospital",
        emoji: "🏥",
        name: "St. Michael Hospital",
        distKm: 0.8,
        coords: [14.455, 120.985],
        color: "#ef4444",
      },
      {
        id: "m1",
        type: "Market",
        emoji: "🛒",
        name: "Zapote Public Market",
        distKm: 1.2,
        coords: [14.458, 120.978],
        color: "#eab308",
      },
      {
        id: "s1",
        type: "Mall",
        emoji: "🛍️",
        name: "SM City Bacoor",
        distKm: 0.5,
        coords: [14.448, 120.984],
        color: "#ec4899",
      },
      {
        id: "c1",
        type: "City Hall",
        emoji: "🏛️",
        name: "City of Bacoor Hall",
        distKm: 2.1,
        coords: [14.44, 120.975],
        color: "#8b5cf6",
      },
      {
        id: "w1",
        type: "Worksite",
        emoji: "🏢",
        name: "Mataasnakahoy Tech Park",
        distKm: 1.8,
        coords: [14.46, 120.99],
        color: "#3b82f6",
      },
    ] as Landmark[],
  },
  {
    id: "LOT-1002",
    name: "Molino Commercial Lot",
    address: "Molino Blvd, Bacoor, Cavite",
    pricePhp: 22000000,
    status: "Under Offer",
    agent: "Cavite Premier Holdings",
    centerCoords: [14.43, 120.995] as LatLngTuple,
    boundaryPolygon: [
      [14.431, 120.994],
      [14.431, 120.996],
      [14.429, 120.996],
      [14.429, 120.994],
    ] as LatLngTuple[],
    frontageLine: [
      [14.431, 120.994],
      [14.431, 120.996],
    ] as LatLngTuple[],
    landmarks: [
      {
        id: "h2",
        type: "Hospital",
        emoji: "🏥",
        name: "Metro South Medical Center",
        distKm: 1.5,
        coords: [14.435, 120.998],
        color: "#ef4444",
      },
      {
        id: "m2",
        type: "Market",
        emoji: "🛒",
        name: "Molino Wet Market",
        distKm: 0.9,
        coords: [14.427, 120.991],
        color: "#eab308",
      },
      {
        id: "s2",
        type: "Mall",
        emoji: "🛍️",
        name: "SM Southmall",
        distKm: 3.4,
        coords: [14.432, 120.996],
        color: "#ec4899",
      },
      {
        id: "p2",
        type: "Park",
        emoji: "🌳",
        name: "Molino Ecological Park",
        distKm: 1.2,
        coords: [14.42, 120.985],
        color: "#22c55e",
      },
    ] as Landmark[],
  },
]

export default function App() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [selectedPropId, setSelectedPropId] = useState<string>(
    PROPERTIES_DATABASE[0].id
  )
  const currentProperty =
    PROPERTIES_DATABASE.find((p) => p.id === selectedPropId) ||
    PROPERTIES_DATABASE[0]

  const [mapTargetCoords, setMapTargetCoords] = useState<LatLngTuple>(
    currentProperty.centerCoords
  )

  // Routing States
  const [originAddress, setOriginAddress] = useState("Manila City Hall")
  const [originCoords, setOriginCoords] = useState<LatLngTuple>([
    14.5896, 120.9817,
  ])
  const [routePolyline, setRoutePolyline] = useState<LatLngTuple[]>([])
  const [routeMetrics, setRouteMetrics] = useState({
    distanceKm: "0",
    durationMin: 0,
  })
  const [loadingRoute, setLoadingRoute] = useState(false)

  useEffect(() => {
    setMapTargetCoords(currentProperty.centerCoords)
    calculateRouteToProperty(originCoords)
  }, [selectedPropId])

  const geocodeAddress = async (address: string): Promise<LatLngTuple> => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await res.json()
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
    throw new Error(`Address not found: ${address}`)
  }

  const calculateRouteToProperty = async (startCoords: LatLngTuple) => {
    setLoadingRoute(true)
    try {
      const dest = currentProperty.centerCoords
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const routeData = await res.json()

      if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0]
        const coordinates: LatLngTuple[] = route.geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]]
        )
        setRoutePolyline(coordinates)

        setRouteMetrics({
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMin: Math.round(route.duration / 60),
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRoute(false)
    }
  }

  const handleSearchRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const coords = await geocodeAddress(originAddress)
      setOriginCoords(coords)
      calculateRouteToProperty(coords)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const calculateGeoMetrics = () => {
    const turfBoundary = currentProperty.boundaryPolygon.map((pt) => [
      pt[1],
      pt[0],
    ])
    turfBoundary.push(turfBoundary[0])
    const poly = turf.polygon([turfBoundary])
    const areaSqm = turf.area(poly)

    const pt1 = turf.point([
      currentProperty.frontageLine[0][1],
      currentProperty.frontageLine[0][0],
    ])
    const pt2 = turf.point([
      currentProperty.frontageLine[1][1],
      currentProperty.frontageLine[1][0],
    ])
    const frontageMeters = turf.distance(pt1, pt2, { units: "meters" })

    return {
      area: areaSqm.toLocaleString("en-US", { maximumFractionDigits: 1 }),
      frontage: frontageMeters.toFixed(1),
    }
  }

  const geoMetrics = calculateGeoMetrics()

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <style>{`
        .custom-property-badge {
          background-color: #f97316 !important;
          color: #ffffff !important;
          border: 2px solid #ea580c !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-weight: bold !important;
          font-size: 12px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
        }
      `}</style>

      {/* --- COLLAPSIBLE UI PANEL --- */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
          width: "90%",
          maxWidth: "460px",
          maxHeight: "90vh",
          overflowY: "auto",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: "#0f172a",
            color: "white",
            borderRadius: isCollapsed ? "16px" : "16px 16px 0 0",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: "15px" }}>
              🏢 Property & Landmark Navigator
            </h4>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              View nearby places & distance
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              border: "none",
              backgroundColor: "#334155",
              color: "white",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            {isCollapsed ? "Show Controls ▼" : "Hide Controls ▲"}
          </button>
        </div>

        {!isCollapsed && (
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* 1. SELECT PROPERTY */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                SELECT PROPERTY LISTING:
              </label>
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontWeight: "bold",
                  marginTop: "4px",
                }}
              >
                {PROPERTIES_DATABASE.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₱{(p.pricePhp / 1000000).toFixed(1)}M
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PRICE & METRICS */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0, color: "#16a34a" }}>
                  ₱{currentProperty.pricePhp.toLocaleString()}
                </h3>
                <span
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {currentProperty.status}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  textAlign: "center",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#fff7ed",
                    padding: "6px",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: "#c2410c" }}>
                    AREA
                  </span>
                  <div style={{ fontWeight: "bold", color: "#ea580c" }}>
                    {geoMetrics.area} sqm
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: "#fff7ed",
                    padding: "6px",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: "#c2410c" }}>
                    FRONTAGE
                  </span>
                  <div style={{ fontWeight: "bold", color: "#ea580c" }}>
                    {geoMetrics.frontage} m
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ROUTE FROM USER LOCATION */}
            <form
              onSubmit={handleSearchRoute}
              style={{
                backgroundColor: "#eff6ff",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #dbeafe",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#1e40af",
                }}
              >
                CALCULATE TRIP FROM YOUR LOCATION:
              </label>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid #93c5fd",
                    fontSize: "12px",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {loadingRoute ? "..." : "Route"}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#1d4ed8",
                    }}
                  >
                    {routeMetrics.distanceKm} km
                  </span>
                  <div style={{ fontSize: "10px", color: "#3b82f6" }}>
                    Distance
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#047857",
                    }}
                  >
                    {routeMetrics.durationMin} mins
                  </span>
                  <div style={{ fontSize: "10px", color: "#10b981" }}>
                    Est. Travel Time
                  </div>
                </div>
              </div>
            </form>

            {/* 4. INTERACTIVE NEARBY LANDMARKS LIST */}
            <div>
              <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                📍 Nearby Establishments (Click to focus):
              </strong>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "6px",
                }}
              >
                {currentProperty.landmarks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setMapTargetCoords(item.coords)}
                    style={{
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "#f1f5f9",
                      cursor: "pointer",
                      borderLeft: `4px solid ${item.color}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{item.emoji}</span>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#334155",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          {item.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#0f172a",
                        }}
                      >
                        {item.distKm} km
                      </span>
                      <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                        from lot
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SATELLITE MAP CONTAINER --- */}
      <MapContainer
        center={mapTargetCoords}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <RecenterMap center={mapTargetCoords} />
        // ✅ STANDARD 2D MAP / GMAPS STYLE (Street, House Names, Road Networks)
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* ORIGIN MARKER */}
        <Marker position={originCoords}>
          <Popup>Origin Location: {originAddress}</Popup>
        </Marker>
        {/* ROUTE LINE */}
        {routePolyline.length > 0 && (
          <Polyline
            positions={routePolyline}
            color="#2563eb"
            weight={5}
            opacity={0.8}
          />
        )}
        {/* PROPERTY POLYGON */}
        <Polygon
          positions={currentProperty.boundaryPolygon}
          pathOptions={{
            color: "#ef4444",
            weight: 4,
            fillColor: "#ef4444",
            fillOpacity: 0.2,
          }}
        >
          <Tooltip
            position={currentProperty.centerCoords}
            permanent
            direction="center"
            className="custom-property-badge"
          >
            <div>
              <div>{currentProperty.name}</div>
              <div>Area: {geoMetrics.area} sqm</div>
            </div>
          </Tooltip>
        </Polygon>
        {/* FRONTAGE LINE */}
        <Polyline
          positions={currentProperty.frontageLine}
          pathOptions={{ color: "#f97316", weight: 6, dashArray: "6, 8" }}
        />
        {/* --- LANDMARK PINS WITH PERMANENT TEXT LABELS BELOW --- */}
        {currentProperty.landmarks.map((lm) => (
          <Marker
            key={lm.id}
            position={lm.coords}
            icon={createLandmarkLabelIcon(
              lm.emoji,
              lm.name,
              lm.distKm,
              lm.color
            )}
          >
            <Popup>
              <div style={{ textAlign: "center", padding: "4px" }}>
                <div style={{ fontSize: "20px" }}>{lm.emoji}</div>
                <strong style={{ fontSize: "13px" }}>{lm.name}</strong>
                <div
                  style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}
                >
                  Type: {lm.type}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#ea580c",
                    marginTop: "4px",
                  }}
                >
                  📍 {lm.distKm} km from property
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
