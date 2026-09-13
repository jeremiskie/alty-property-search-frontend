import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface Property {
  property_id: string;
  title: string;
  property_type: 'House & Lot' | 'Lot Only' | 'Apartment' | 'Condominium';
  address: string;
  price_php: number;
  bedrooms: number;
  lot_area_sqm: number;
  floor_area_sqm: number;
  is_loft_predicted: number;
  distance_to_alabang_km: number;
  predicted_commute_mins: number;
  match_score: number;
  description: string;
  media_gallery: string[];
  video_url: string;
}

export interface ExtractedSpecs {
  max_budget: number;
  requested_type: string | null;
  prefer_loft: boolean;
}

export interface ApiResponse {
  status: string;
  extracted_specs: ExtractedSpecs;
  count: number;
  data: Property[];
}

export const PropertySearch: React.FC = () => {
  const [promptText, setPromptText] = useState<string>(
    "Gusto ko ng House & Lot o kaya Lote lang malapit sa Alabang, budget 10M."
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [extractedSpecs, setExtractedSpecs] = useState<ExtractedSpecs | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const alabangCoords: [number, number] = [14.4172, 121.0421];

  const handleSearch = async (): Promise<void> => {
    if (!promptText.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>('http://127.0.0.1:8000/api/recommend-by-text', {
        user_prompt: promptText,
      });
      setProperties(response.data.data);
      setExtractedSpecs(response.data.extracted_specs);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Helper Badge Color dependa sa Property Type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'House & Lot': return '#0284c7'; // Blue
      case 'Lot Only': return '#d97706';   // Amber / Orange
      case 'Apartment': return '#7c3aed';  // Purple
      default: return '#16a34a';           // Green (Condo)
    }
  };

  const latOffsets = [0.002, -0.008, 0.012, -0.005, 0.009, -0.011, 0.004, -0.003, 0.015, -0.014];
  const lngOffsets = [-0.005, -0.012, -0.003, -0.018, -0.009, -0.015, -0.022, -0.007, -0.011, -0.025];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '440px', padding: '20px', overflowY: 'auto', borderRight: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>🏡 Multi-Type Real Estate Search</h2>

        {/* PROMPT TEXTAREA */}
        <div style={{ marginBottom: '15px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
            Ano ang hinahanap mong Property? (House & Lot, Lote, Condo, o Apartment):
          </label>
          <textarea
            rows={4}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Searching...' : '✨ Find Matching Properties'}
          </button>
        </div>

        {/* PARSED INTENT */}
        {extractedSpecs && (
          <div style={{ marginBottom: '15px', background: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '12px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#166534' }}>AI Filter Analysis:</p>
            <span>💰 Max Budget: <b>₱{(extractedSpecs.max_budget / 1000000).toFixed(1)}M</b> | </span>
            <span>🏠 Detected Category: <b>{extractedSpecs.requested_type || 'All Property Types'}</b></span>
          </div>
        )}

        <h3 style={{ fontSize: '15px', margin: '0 0 10px 0' }}>Recommended List ({properties.length})</h3>

        {/* PROPERTY CARDS */}
        {properties.map((prop: Property) => (
          <div
            key={prop.property_id}
            onClick={() => setSelectedProperty(prop)}
            style={{
              background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '12px',
              border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ position: 'relative', height: '130px', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
              <img src={prop.media_gallery[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* PROPERTY TYPE BADGE */}
              <span style={{
                position: 'absolute', top: '8px', left: '8px',
                backgroundColor: getTypeBadgeColor(prop.property_type),
                color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'
              }}>
                {prop.property_type}
              </span>
            </div>

            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{prop.title}</h4>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '2px 0' }}>
              ₱{prop.price_php.toLocaleString()}
            </p>

            <div style={{ fontSize: '12px', color: '#475569' }}>
              {prop.property_type === 'Lot Only' ? (
                <p style={{ margin: '2px 0' }}>📐 Lot Area: <b>{prop.lot_area_sqm} sqm</b> (Lote)</p>
              ) : (
                <p style={{ margin: '2px 0' }}>🛏️ {prop.bedrooms} Bed | 📐 Floor: {prop.floor_area_sqm} sqm {prop.lot_area_sqm > 0 && `| Lot: ${prop.lot_area_sqm} sqm`}</p>
              )}
              <p style={{ margin: '2px 0' }}>🚗 Distance to Alabang: <b>{prop.distance_to_alabang_km} km ({prop.predicted_commute_mins} mins)</b></p>
            </div>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div style={{ flex: 1, height: '100%' }}>
        <MapContainer center={alabangCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={alabangCoords}>
            <Popup><b>💼 Alabang Commercial Hub</b></Popup>
          </Marker>

          {properties.map((prop: Property, idx: number) => {
            const lat = alabangCoords[0] + (latOffsets[idx % 10]);
            const lng = alabangCoords[1] + (lngOffsets[idx % 10]);

            return (
              <Marker key={prop.property_id} position={[lat, lng]}>
                <Popup>
                  <div>
                    <span style={{ fontSize: '10px', color: '#fff', background: getTypeBadgeColor(prop.property_type), padding: '2px 6px', borderRadius: '4px' }}>
                      {prop.property_type}
                    </span><br />
                    <b>{prop.title}</b><br />
                    ₱{prop.price_php.toLocaleString()}<br />
                    <button onClick={() => setSelectedProperty(prop)} style={{ marginTop: '5px', cursor: 'pointer' }}>View Details</button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FULL MODAL */}
      {selectedProperty && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '650px', padding: '20px', borderRadius: '12px', position: 'relative' }}>
            <button onClick={() => setSelectedProperty(null)} style={{ position: 'absolute', top: '15px', right: '15px' }}>✕</button>
            <span style={{ backgroundColor: getTypeBadgeColor(selectedProperty.property_type), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {selectedProperty.property_type}
            </span>
            <h2 style={{ margin: '8px 0 4px 0' }}>{selectedProperty.title}</h2>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>₱{selectedProperty.price_php.toLocaleString()}</p>
            <img src={selectedProperty.media_gallery[0]} alt="Property" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', margin: '10px 0' }} />
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <p>📍 Location: <b>{selectedProperty.address}</b></p>
              <p>📐 Lot Area: <b>{selectedProperty.lot_area_sqm} sqm</b> | Floor Area: <b>{selectedProperty.floor_area_sqm} sqm</b></p>
              <p>🚗 Predicted Commute to Alabang: <b>{selectedProperty.predicted_commute_mins} mins ({selectedProperty.distance_to_alabang_km} km)</b></p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertySearch;