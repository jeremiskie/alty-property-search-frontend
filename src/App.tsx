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
  address: string;
  price_php: number;
  bedrooms: number;
  floor_area_sqm: number;
  is_loft_predicted: number;
  distance_to_alabang_km: number;
  predicted_commute_mins: number;
  match_score: number;
  description: string;
  media_gallery: string[];
  video_url: string;
}

export interface ApiResponse {
  status: string;
  count: number;
  data: Property[];
}

export const PropertySearch: React.FC = () => {
  const [budget, setBudget] = useState<number>(10000000);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // NEW: State para sa Preview Modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [showVideo, setShowVideo] = useState<boolean>(false);

  const alabangCoords: [number, number] = [14.4172, 121.0421];

  const fetchProperties = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(
        'http://127.0.0.1:8000/api/recommendations',
        { params: { max_budget: budget, bedrooms: bedrooms } }
      );
      setProperties(response.data.data);
    } catch (error) {
      console.error('Error fetching ML recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [budget, bedrooms]);

  const openPreview = (prop: Property) => {
    setSelectedProperty(prop);
    setActiveMediaIndex(0);
    setShowVideo(false);
  };

  // Fixed Map Pin Offsets (Inilagay sa lupa sa paligid ng Alabang)
  const latOffsets = [0.002, -0.008, 0.012, -0.005, 0.009, -0.011, 0.004, -0.003, 0.015, -0.014];
  const lngOffsets = [-0.005, -0.012, -0.003, -0.018, -0.009, -0.015, -0.022, -0.007, -0.011, -0.025];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '420px', padding: '20px', overflowY: 'auto', borderRight: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 15px 0' }}>🏡 Property Search & ML Match</h2>

        {/* Filters */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 'bold', display: 'block' }}>Max Budget: ₱{(budget / 1000000).toFixed(1)}M</label>
          <input
            type="range"
            min={5000000}
            max={20000000}
            step={500000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{ width: '100%', margin: '10px 0' }}
          />

          <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Bedrooms:</label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={1}>1 Bedroom</option>
            <option value={2}>2 Bedrooms</option>
            <option value={3}>3 Bedrooms</option>
          </select>
        </div>

        <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Results ({properties.length})</h3>
        {loading && <p style={{ color: '#666' }}>Calculating ML predictions...</p>}

        {/* Property Cards List */}
        {properties.map((prop: Property) => (
          <div
            key={prop.property_id}
            onClick={() => openPreview(prop)}
            style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {/* Media Thumbnail */}
            <div style={{ position: 'relative', height: '140px', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
              <img 
                src={prop.media_gallery[0]} 
                alt={prop.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <span style={{
                position: 'absolute', top: '8px', right: '8px',
                backgroundColor: prop.is_loft_predicted > 0.8 ? '#22c55e' : '#64748b',
                color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'
              }}>
                {prop.is_loft_predicted > 0.8 ? '🔥 High Loft Match' : 'Standard'}
              </span>
            </div>

            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{prop.title}</h4>
            <p style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0' }}>
              ₱{prop.price_php.toLocaleString()}
            </p>

            <div style={{ fontSize: '12px', color: '#475569' }}>
              <p style={{ margin: '2px 0' }}>🛏️ {prop.bedrooms} Bed | 📐 {prop.floor_area_sqm} sqm | 🏗️ Loft: {(prop.is_loft_predicted * 100).toFixed(0)}%</p>
              <p style={{ margin: '2px 0' }}>📍 {prop.distance_to_alabang_km} km to Worksite</p>
              <p style={{ margin: '2px 0' }}>
                🚗 Commute: <b style={{ color: prop.predicted_commute_mins > 12 ? '#ef4444' : '#16a34a' }}>{prop.predicted_commute_mins} mins</b>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MAP SECTION */}
      <div style={{ flex: 1, height: '100%' }}>
        <MapContainer center={alabangCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={alabangCoords}>
            <Popup><b>💼 Worksite Pin</b><br />Alabang, Muntinlupa</Popup>
          </Marker>

          {properties.map((prop: Property, idx: number) => {
            const lat = alabangCoords[0] + (latOffsets[idx % 10]);
            const lng = alabangCoords[1] + (lngOffsets[idx % 10]);

            return (
              <Marker key={prop.property_id} position={[lat, lng]}>
                <Popup>
                  <div style={{ padding: '2px' }}>
                    <b>{prop.title}</b><br />
                    ₱{prop.price_php.toLocaleString()}<br />
                    Commute: {prop.predicted_commute_mins} mins<br />
                    <button 
                      onClick={() => openPreview(prop)}
                      style={{ marginTop: '5px', padding: '4px 8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      View Full Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FULL PROPERTY PREVIEW MODAL */}
      {selectedProperty && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', width: '750px', maxHeight: '90vh', borderRadius: '12px', overflowY: 'auto',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              style={{
                position: 'absolute', top: '15px', right: '20px', border: 'none', background: '#f1f5f9',
                borderRadius: '50%', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h2 style={{ margin: '0 0 5px 0' }}>{selectedProperty.title}</h2>
            <p style={{ color: '#64748b', margin: '0 0 15px 0', fontSize: '14px' }}>📍 {selectedProperty.address}</p>

            {/* MEDIA PREVIEW SECTION */}
            <div style={{ marginBottom: '15px' }}>
              {/* Media Switcher Tabs */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  onClick={() => setShowVideo(false)}
                  style={{
                    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    background: !showVideo ? '#2563eb' : '#e2e8f0', color: !showVideo ? '#fff' : '#333'
                  }}
                >
                  📷 Photos ({selectedProperty.media_gallery.length})
                </button>
                <button
                  onClick={() => setShowVideo(true)}
                  style={{
                    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    background: showVideo ? '#2563eb' : '#e2e8f0', color: showVideo ? '#fff' : '#333'
                  }}
                >
                  🎥 Video Tour
                </button>
              </div>

              {/* Display Box */}
              <div style={{ width: '100%', height: '320px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {!showVideo ? (
                  <img
                    src={selectedProperty.media_gallery[activeMediaIndex]}
                    alt="Property Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <video controls style={{ width: '100%', height: '100%' }}>
                    <source src={selectedProperty.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Photo Thumbnails Selector */}
              {!showVideo && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {selectedProperty.media_gallery.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="thumb"
                      onClick={() => setActiveMediaIndex(idx)}
                      style={{
                        width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer',
                        border: activeMediaIndex === idx ? '3px solid #2563eb' : '1px solid #ccc'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DETAILS & ML INSIGHTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Property Specs</h4>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>💵 Price: <b>₱{selectedProperty.price_php.toLocaleString()}</b></p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>🛏️ Bedrooms: <b>{selectedProperty.bedrooms}</b></p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>📐 Floor Area: <b>{selectedProperty.floor_area_sqm} sqm</b></p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>🤖 ML Commute & Layout Model</h4>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>🚗 Est. Travel Time: <b>{selectedProperty.predicted_commute_mins} mins</b></p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>📍 Distance: <b>{selectedProperty.distance_to_alabang_km} km</b></p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>🏗️ Loft Probability: <b>{(selectedProperty.is_loft_predicted * 100).toFixed(0)}%</b></p>
              </div>
            </div>

            <h4 style={{ marginTop: '15px', marginBottom: '5px' }}>Description</h4>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{selectedProperty.description}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertySearch;