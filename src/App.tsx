import React, { useState } from 'react';
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

// Component para kusa mag-recenter ang mapa
function RecenterMap({ center }: { center: LatLngTuple }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// Sample Database ng Property Lot
const SAMPLE_PROPERTY = {
  name: "VMUF Land Property",
  boundary: [
    [15.9862, 120.5715],
    [15.9862, 120.5721],
    [15.9835, 120.5721],
    [15.9835, 120.5715],
    [15.9848, 120.5715],
    [15.9848, 120.5717],
  ] as LatLngTuple[],
  frontageLine: [
    [15.9835, 120.5715],
    [15.9835, 120.5721],
  ] as LatLngTuple[],
};

export default function App() {
  // Mode & Collapse States
  const [activeTab, setActiveTab] = useState<'route' | 'property'>('route');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // State para sa Route Navigation
  const [originInput, setOriginInput] = useState('Bacoor, Cavite');
  const [destInput, setDestInput] = useState('SM City Bacoor');
  const [originCoords, setOriginCoords] = useState<LatLngTuple>([14.4506, 120.9828]);
  const [destCoords, setDestCoords] = useState<LatLngTuple | null>(null);
  const [routePolyline, setRoutePolyline] = useState<LatLngTuple[]>([]);
  const [routeMetrics, setRouteMetrics] = useState({ distanceKm: '0', durationMin: 0 });

  // State para sa Property Viewer
  const [propertySearch, setPropertySearch] = useState('VMUF Lot');
  const [propertyCenter] = useState<LatLngTuple>([15.9848, 120.5718]);

  const [loading, setLoading] = useState(false);

  // Helper: Geocode Address to Lat/Lng
  const geocodeAddress = async (address: string): Promise<LatLngTuple> => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    throw new Error(`Location not found: ${address}`);
  };

  // Handler: Calculate Route
  const handleRouteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const start = await geocodeAddress(originInput);
      const end = await geocodeAddress(destInput);
      setOriginCoords(start);
      setDestCoords(end);

      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Turf.js Property Calculations
  const calculatePropertyMetrics = () => {
    const turfBoundary = SAMPLE_PROPERTY.boundary.map((pt) => [pt[1], pt[0]]);
    turfBoundary.push(turfBoundary[0]);
    const poly = turf.polygon([turfBoundary]);
    const areaSqm = turf.area(poly);

    const pt1 = turf.point([SAMPLE_PROPERTY.frontageLine[0][1], SAMPLE_PROPERTY.frontageLine[0][0]]);
    const pt2 = turf.point([SAMPLE_PROPERTY.frontageLine[1][1], SAMPLE_PROPERTY.frontageLine[1][0]]);
    const frontageMeters = turf.distance(pt1, pt2, { units: 'meters' });

    return {
      area: areaSqm.toLocaleString('en-US', { maximumFractionDigits: 1 }),
      frontage: frontageMeters.toFixed(1),
    };
  };

  const propMetrics = calculatePropertyMetrics();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* CSS Styling */}
      <style>{`
        .custom-property-badge {
          background-color: #f97316 !important;
          color: #ffffff !important;
          border: 2px solid #ea580c !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-weight: bold !important;
          font-size: 14px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
        }
        .custom-property-badge::before { border-top-color: #f97316 !important; }
      `}</style>

      {/* --- COLLAPSIBLE FLOATING UI PANEL --- */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0px 10px 30px rgba(0,0,0,0.25)',
        width: '90%',
        maxWidth: '440px',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out'
      }}>
        
        {/* HEADER / TABS WITH TOGGLE HIDE BUTTON */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: '#f1f5f9', 
          borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0' 
        }}>
          <button
            onClick={() => { setActiveTab('route'); setIsCollapsed(false); }}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              backgroundColor: activeTab === 'route' ? '#ffffff' : 'transparent',
              fontWeight: 'bold',
              color: activeTab === 'route' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'route' && !isCollapsed ? '3px solid #2563eb' : 'none'
            }}
          >
            🚗 Route Navigation
          </button>

          <button
            onClick={() => { setActiveTab('property'); setIsCollapsed(false); }}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              backgroundColor: activeTab === 'property' ? '#ffffff' : 'transparent',
              fontWeight: 'bold',
              color: activeTab === 'property' ? '#ea580c' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === 'property' && !isCollapsed ? '3px solid #ea580c' : 'none'
            }}
          >
            📐 Property Lot Area
          </button>

          {/* HIDE / SHOW TOGGLE BUTTON */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Show Controls" : "Hide Controls"}
            style={{
              border: 'none',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              marginRight: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        {/* BODY CONTAINER (NAtatago kapag `isCollapsed === true`) */}
        {!isCollapsed && (
          <div style={{ padding: '16px' }}>
            {/* TAB 1: ROUTE FORM */}
            {activeTab === 'route' && (
              <form onSubmit={handleRouteSearch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Current Location (Origin):</label>
                  <input 
                    type="text" 
                    value={originInput} 
                    onChange={(e) => setOriginInput(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Drop-off Destination:</label>
                  <input 
                    type="text" 
                    value={destInput} 
                    onChange={(e) => setDestInput(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    required 
                  />
                </div>
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Calculating...' : 'Search Route'}
                </button>

                {destCoords && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '4px', textAlign: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#2563eb' }}>{routeMetrics.distanceKm} <span style={{ fontSize: '12px' }}>km</span></h3>
                      <span style={{ fontSize: '11px', color: '#666' }}>Distance</span>
                    </div>
                    <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                      <h3 style={{ margin: 0, color: '#059669' }}>{routeMetrics.durationMin} <span style={{ fontSize: '12px' }}>mins</span></h3>
                      <span style={{ fontSize: '11px', color: '#666' }}>Est. Time</span>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: PROPERTY FORM */}
            {activeTab === 'property' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>Search Property / Lot Name:</label>
                  <input 
                    type="text" 
                    value={propertySearch} 
                    onChange={(e) => setPropertySearch(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #ffedd5', textAlign: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#ea580c' }}>{propMetrics.area} <span style={{ fontSize: '12px' }}>sqm</span></h3>
                    <span style={{ fontSize: '11px', color: '#9a3412' }}>Total Area</span>
                  </div>
                  <div style={{ borderLeft: '1px solid #fed7aa', paddingLeft: '20px' }}>
                    <h3 style={{ margin: 0, color: '#ea580c' }}>{propMetrics.frontage} <span style={{ fontSize: '12px' }}>m</span></h3>
                    <span style={{ fontSize: '11px', color: '#9a3412' }}>Frontage</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MAP CONTAINER --- */}
      <MapContainer center={activeTab === 'route' ? originCoords : propertyCenter} zoom={activeTab === 'route' ? 13 : 17} style={{ height: '100%', width: '100%' }}>
        <RecenterMap center={activeTab === 'route' ? originCoords : propertyCenter} />

        <TileLayer
          attribution="&copy; OpenStreetMap & Esri"
          url={
            activeTab === 'route'
              ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          }
        />

        {/* TAB 1 MAP OVERLAYS */}
        {activeTab === 'route' && (
          <>
            <Marker position={originCoords}><Popup>Origin: {originInput}</Popup></Marker>
            {destCoords && <Marker position={destCoords}><Popup>Destination: {destInput}</Popup></Marker>}
            {routePolyline.length > 0 && <Polyline positions={routePolyline} color="#2563eb" weight={5} opacity={0.8} />}
          </>
        )}

        {/* TAB 2 MAP OVERLAYS */}
        {activeTab === 'property' && (
          <>
            <Polygon positions={SAMPLE_PROPERTY.boundary} pathOptions={{ color: '#ef4444', weight: 4, fillColor: '#ef4444', fillOpacity: 0.15 }}>
              <Tooltip position={propertyCenter} permanent direction="center" className="custom-property-badge">
                <div>
                  <div>Area = {propMetrics.area} sqm</div>
                  <div>Frontage = {propMetrics.frontage} meters</div>
                </div>
              </Tooltip>
            </Polygon>
            <Polyline positions={SAMPLE_PROPERTY.frontageLine} pathOptions={{ color: '#f97316', weight: 5, dashArray: '6, 8' }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}