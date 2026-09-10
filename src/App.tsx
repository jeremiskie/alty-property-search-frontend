import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component para i-recenter ang mapa kapag nagbago ang coordinates
function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function SearchRouteApp() {
  const [originInput, setOriginInput] = useState('Bacoor, Cavite');
  const [destInput, setDestInput] = useState('SM City Bacoor');
  
  const [originCoords, setOriginCoords] = useState([14.4506, 120.9828]);
  const [destCoords, setDestCoords] = useState(null);
  
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0 });
  const [loading, setLoading] = useState(false);

  // Function para i-convert ang address text patungong Lat/Lng gamit ang Nominatim API
  const geocodeAddress = async (address) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    throw new Error(`Hindi makita ang lokasyon: ${address}`);
  };

  // Function para kunin ang route mula OSRM
  const fetchRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setRoutePolyline(coordinates);

      const km = (route.distance / 1000).toFixed(1);
      const mins = Math.round(route.duration / 60);
      setRouteInfo({ distanceKm: km, durationMin: mins });
    }
  };

  // Handler kapag pinindot ang Search button
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const start = await geocodeAddress(originInput);
      const end = await geocodeAddress(destInput);

      setOriginCoords(start);
      setDestCoords(end);

      await fetchRoute(start, end);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- FLOATING SEARCH UI AT TOP --- */}
      <form onSubmit={handleSearch} style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0px 10px 25px rgba(0,0,0,0.2)',
        width: '90%',
        maxWidth: '450px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Current Location (Origin):</label>
          <input 
            type="text" 
            value={originInput} 
            onChange={(e) => setOriginInput(e.target.value)}
            placeholder="Hal. Bacoor, Cavite"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Destination:</label>
          <input 
            type="text" 
            value={destInput} 
            onChange={(e) => setDestInput(e.target.value)}
            placeholder="Hal. SM Mall of Asia"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
            required
          />
        </div>

        <button type="submit" style={{
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '4px'
        }}>
          {loading ? 'Kinakalkula ang Ruta...' : 'Hanapin ang Ruta (Search Route)'}
        </button>

        {/* --- TRIP METRICS CONTAINER (KM & MINS) --- */}
        {destCoords && !loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            borderTop: '1px solid #eee',
            paddingTop: '12px',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#2563eb', fontSize: '20px' }}>{routeInfo.distanceKm} <span style={{ fontSize: '12px' }}>km</span></h3>
              <span style={{ fontSize: '11px', color: '#666' }}>Distansya</span>
            </div>
            <div style={{ borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
              <h3 style={{ margin: 0, color: '#059669', fontSize: '20px' }}>{routeInfo.durationMin} <span style={{ fontSize: '12px' }}>mins</span></h3>
              <span style={{ fontSize: '11px', color: '#666' }}>Tantiya sa Oras</span>
            </div>
          </div>
        )}
      </form>

      {/* --- MAP --- */}
      <MapContainer 
        center={originCoords} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapView center={originCoords} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={originCoords}>
          <Popup>Origin: {originInput}</Popup>
        </Marker>

        {destCoords && (
          <Marker position={destCoords}>
            <Popup>Destination: {destInput}</Popup>
          </Marker>
        )}

        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} color="#2563eb" weight={5} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
}