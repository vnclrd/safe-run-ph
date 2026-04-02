"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Target, ShieldAlert } from 'lucide-react';

// Custom Icon for Hazards
const createIcon = (emoji: string) => L.divIcon({
  html: `<div class="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-blue-500 shadow-lg text-2xl animate-in zoom-in duration-300">${emoji}</div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Logic to move the map to a specific coordinate
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { animate: true, duration: 2 });
  }, [center, map]);
  return null;
}

export default function MapPreview() {
  const [markers, setMarkers] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);

  // 1. Listen for Live Alerts across Metro Manila
  useEffect(() => {
    const q = query(collection(db, "markers"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMarkers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. High-Accuracy Geolocation Logic
  const detectLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported on this browser.");
    
    // High-accuracy configuration for GPS hardware
    const geoOptions = {
      enableHighAccuracy: true, 
      timeout: 15000,           
      maximumAge: 0             
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLoc([latitude, longitude]);
        setAccuracy(accuracy);
      },
      (err) => {
        alert("Please enable High Accuracy location in your device settings.");
        console.error(err);
      },
      geoOptions
    );
  };

  return (
    <div className="relative group">
      <div className="h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative z-0 bg-slate-100">
        <MapContainer 
          center={[14.5547, 121.0244]} // Default: Makati/BGC
          zoom={12} 
          className="h-full w-full"
          zoomControl={false} // Cleaner UI
        >
          {/* Strava-style Minimalist Tiles */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />
          
          <MapController center={userLoc} />

          {/* Precise User Location Indicator */}
          {userLoc && (
            <>
              <Marker position={userLoc} icon={L.divIcon({ html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md animate-pulse"></div>', className: 'user-dot' })} />
              <Circle 
                center={userLoc} 
                radius={accuracy} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} 
              />
            </>
          )}

          {/* Hazard Markers */}
          {markers.map((m) => (
            m.location && (
              <Marker 
                key={m.id} 
                position={[m.location.lat, m.location.lng]} 
                icon={createIcon(m.type === "DOG" ? "🐕" : m.type === "LIGHT" ? "💡" : "🚧")}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-2 font-sans min-w-[150px]">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1">
                      <ShieldAlert size={12} /> {m.type} Alert
                    </div>
                    <p className="text-sm text-slate-800 leading-snug">{m.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2 italic">Reported in Metro Manila</p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Primary Action Button: Locate */}
      <button 
        onClick={detectLocation}
        className="absolute bottom-10 right-10 z-[1000] bg-blue-600 text-white p-6 rounded-full shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:bg-blue-700 transition-all active:scale-90 border-4 border-white"
        title="Find My Location"
      >
        <Target size={32} />
      </button>
    </div>
  );
}