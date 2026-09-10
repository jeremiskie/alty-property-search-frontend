import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Tooltip, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component para kusa mag-recenter ang mapa kapag may napiling property
function RecenterMap({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// --- DUMMY PROPERTY DATABASE ---
const PROPERTIES_DATABASE = [
  {
    id: "LOT-1001",
    name: "VMUF Central Prime Lot",
    address: "Tirona Hwy, Bacoor, Cavite",
    pricePhp: 15500000,
    status: "For Sale",
    agent: "Bacoor Realty Partners",
    centerCoords: [14.4506, 120.9828] as LatLngTuple,
    // [Lat, Lng] coordinates ng Polygon Boundary
    boundaryPolygon: [
      [14.4515, 120.9815],
      [14.4515, 120.9825],
      [14.4500, 120.9825],
      [14.4500, 120.9815],
    ] as LatLngTuple[],
    frontageLine: [
      [14.4515, 120.9815],
      [14.4515, 120.9825],
    ] as LatLngTuple[],
    proximity: {
      hospital: "Bacoor Doctors Med Center (0.8 km)",
      market: "Zapote Public Market (1.2 km)",
      mall: "SM City Bacoor (0.5 km)",
      park: "Cavite City Hall Park (2.5 km)",
      worksite: "Mataasnakahoy Tech Park (1.8 km)"
    }
  },
  {
    id: "LOT-1002",
    name: "Molino Commercial Boulevard Lot",
    address: "Molino Blvd, Bacoor, Cavite",
    pricePhp: 22000000,
    status: "Under Offer",
    agent: "Cavite Premier Holdings",
    centerCoords: [14.4300, 120.9950] as LatLngTuple,
    boundaryPolygon: [
      [14.4310, 120.9940],
      [14.4310, 120.9960],
      [14.4290, 120.9960],
      [14.4290, 120.9940],
    ] as LatLngTuple[],
    frontageLine: [
      [14.4310, 120.9940],
      [14.4310, 120.9960],
    ] as LatLngTuple[],
    proximity: {
      hospital: "Prime Global Hospital (1.5 km)",
      market: "Molino Wet Market (0.9 km)",
      mall: "Vistamall Molino (0.4 km)",
      park: "Tirona Park (3.0 km)",
      worksite: "Cavite EcoZone (4.5 km)"
    }
  }
];

export default function App() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  // State para sa napiling Property mula sa database
  const [selectedPropId, setSelectedPropId] = useState<string>(PROPERTIES_DATABASE[0].id);
  const currentProperty = PROPERTIES_DATABASE.find(p => p.id === selectedPropId) || PROPERTIES_DATABASE[0];

  // State para sa Routing papunta sa Property
  const [originAddress, setOriginAddress] = useState('Manila City Hall');
  const [originCoords, setOriginCoords] = useState<LatLngTuple>([14.5896, 120.9817]); // Default Manila
  const [routePolyline, setRoutePolyline] = useState<LatLngTuple[]>([]);
  const [routeMetrics, setRouteMetrics] = useState({ distanceKm: '0', durationMin: 0 });
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Helper: Geocode User Input Address
  const geocodeAddress = async (address: string): Promise<LatLngTuple> => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    throw new Error(`Address not found: ${address}`);
  };

  // Handler: Calculate Route at Byahe Time papunta sa Napiling Property
  const calculateRouteToProperty = async (startCoords: LatLngTuple) => {
    setLoadingRoute(true);
    try {
      const dest = currentProperty.centerCoords;
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const routeData = await res.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const coordinates: LatLngTuple[] = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        setRoutePolyline(coordinates);

        setRouteMetrics({
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMin: Math.round(route.duration / 60),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Trigger Routing kapag nagbago ang Napiling Property o Origin Address
  const handleSearchRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const coords = await geocodeAddress(originAddress);
      setOriginCoords(coords);
      calculateRouteToProperty(coords);
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    calculateRouteToProperty(originCoords);
  }, [selectedPropId]);

  // Turf.js Calculations para sa Polygon Area at Frontage Length
  const calculateGeoMetrics = () => {
    // Turf expects coordinates in [Lng, Lat] format
    const turfBoundary = currentProperty.boundaryPolygon.map((pt) => [pt[1], pt[0]]);
    turfBoundary.push(turfBoundary[0]); // Close polygon
    const poly = turf.polygon([turfBoundary]);
    const areaSqm = turf.area(poly);

    const pt1 = turf.point([currentProperty.frontageLine[0][1], currentProperty.frontageLine[0][0]]);
    const pt2 = turf.point([currentProperty.frontageLine[1][1], currentProperty.frontageLine[1][0]]);
    const frontageMeters = turf.distance(pt1, pt2, { units: 'meters' });

    return {
      area: areaSqm.toLocaleString('en-US', { maximumFractionDigits: 1 }),
      frontage: frontageMeters.toFixed(1),
    };
  };

  const geoMetrics = calculateGeoMetrics();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Badge styling sa mapa */}
      <style>{`
        .custom-property-badge {
          background-color: #f97316 !important;
          color: #ffffff !important;
          border: 2px solid #ea580c !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-weight: bold !important;
          font-size: 13px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
        }
      `}</style>

      {/* --- COLLAPSIBLE FLOATING UI CONTAINER --- */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
        width: '90%',
        maxWidth: '460px',
        maxHeight: '90vh',
        overflowY: 'auto',
        transition: 'all 0.3s ease-in-out'
      }}>
        
        {/* HEADER BAR WITH HIDE/SHOW BUTTON */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px', 
          backgroundColor: '#0f172a', 
          color: 'white',
          borderRadius: isCollapsed ? '16px' : '16px 16px 0 0'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px' }}>🏢 Real Estate Property Viewer</h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Select listing & check trip details</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              border: 'none',
              backgroundColor: '#334155',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            {isCollapsed ? 'Show Controls ▼' : 'Hide Controls ▲'}
          </button>
        </div>

        {/* CONTAINER CONTENT */}
        {!isCollapsed && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. SELECTOR NG PROPERTY DUMMY DATA */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>SELECT PROPERTY LISTING:</label>
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', marginTop: '4px' }}
              >
                {PROPERTIES_DATABASE.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - ₱{(p.pricePhp / 1000000).toFixed(1)}M</option>
                ))}
              </select>
            </div>

            {/* 2. PRICE & KEY PROPERTY DETAILS */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#16a34a' }}>₱{currentProperty.pricePhp.toLocaleString()}</h3>
                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                  {currentProperty.status}
                </span>
              </div>
              <p style={{ margin: '4px 0 8px 0', fontSize: '12px', color: '#64748b' }}>{currentProperty.address}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                  <span style={{ fontSize: '10px', color: '#c2410c' }}>TOTAL LOT AREA</span>
                  <div style={{ fontWeight: 'bold', color: '#ea580c', fontSize: '14px' }}>{geoMetrics.area} sqm</div>
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                  <span style={{ fontSize: '10px', color: '#c2410c' }}>FRONTAGE WIDTH</span>
                  <div style={{ fontWeight: 'bold', color: '#ea580c', fontSize: '14px' }}>{geoMetrics.frontage} meters</div>
                </div>
              </div>
            </div>

            {/* 3. TRIP ROUTE CALCULATOR (ORIGIN TO PROPERTY) */}
            <form onSubmit={handleSearchRoute} style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #dbeafe' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af' }}>CALCULATE TRIP FROM YOUR LOCATION:</label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  placeholder="Enter starting location..."
                  style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12px' }}
                />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  {loadingRoute ? '...' : 'Route'}
                </button>
              </div>

              {/* ROUTING RESULTS */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1d4ed8' }}>{routeMetrics.distanceKm} km</div>
                  <div style={{ fontSize: '10px', color: '#3b82f6' }}>Actual Road Distance</div>
                </div>
                <div style={{ borderLeft: '1px solid #bfdbfe', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#047857' }}>{routeMetrics.durationMin} mins</div>
                  <div style={{ fontSize: '10px', color: '#10b981' }}>Est. Travel Time</div>
                </div>
              </div>
            </form>

            {/* 4. PROXIMITY TO LANDMARKS */}
            <div style={{ fontSize: '11px', color: '#334155' }}>
              <strong style={{ color: '#0f172a' }}>📍 Nearby Landmarks / Establishments:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>🏥 <b>Hospital:</b> {currentProperty.proximity.hospital}</li>
                <li>🛒 <b>Market:</b> {currentProperty.proximity.market}</li>
                <li>🛍️ <b>Mall:</b> {currentProperty.proximity.mall}</li>
                <li>🌳 <b>Park:</b> {currentProperty.proximity.park}</li>
                <li>🏢 <b>Worksite:</b> {currentProperty.proximity.worksite}</li>
              </ul>
            </div>

            <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>
              Listing Agent: <b>{currentProperty.agent}</b>
            </div>

          </div>
        )}
      </div>

      {/* --- LEAFLET SATELLITE MAP CONTAINER --- */}
      <MapContainer center={currentProperty.centerCoords} zoom={16} style={{ height: '100%', width: '100%' }}>
        <RecenterMap center={currentProperty.centerCoords} />

        {/* ArcGIS World Imagery (Satellite Tiles) */}
        <TileLayer
          attribution="&copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* ORIGIN MARKER */}
        <Marker position={originCoords}>
          <Popup>Origin Location: {originAddress}</Popup>
        </Marker>

        {/* BLUE ROUTE LINE */}
        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} color="#2563eb" weight={5} opacity={0.8} />
        )}

        {/* RED PROPERTY POLYGON BOUNDARY */}
        <Polygon
          positions={currentProperty.boundaryPolygon}
          pathOptions={{ color: '#ef4444', weight: 4, fillColor: '#ef4444', fillOpacity: 0.2 }}
        >
          <Tooltip position={currentProperty.centerCoords} permanent direction="center" className="custom-property-badge">
            <div>
              <div>{currentProperty.name}</div>
              <div>Area: {geoMetrics.area} sqm</div>
              <div>Frontage: {geoMetrics.frontage} m</div>
            </div>
          </Tooltip>
        </Polygon>

        {/* ORANGE FRONTAGE LINE */}
        <Polyline
          positions={currentProperty.frontageLine}
          pathOptions={{ color: '#f97316', weight: 6, dashArray: '6, 8' }}
        />
      </MapContainer>
    </div>
  );
}