import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const foodIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map centering
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13); // Zoom level 13 for navigated locations
    }
  }, [center, map]);
  return null;
}

export default function MapView({ listings, userLocation, center, onListingClick }) {
  // Default center (use custom center, user location, or default to a general location)
  const defaultCenter = center || userLocation || [28.6139, 77.2090]; // Default to Delhi, India
  const zoom = center ? 13 : (userLocation ? 13 : 10);

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter center={center || userLocation} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold mb-1">📍 Your Location</h3>
                <p className="text-sm text-gray-600">You are here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Food Listing Markers */}
        {listings && listings.map((listing) => {
          // Ensure lat/lng exist
          if (!listing.lat || !listing.lng) return null;

          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={foodIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Servings:</span>
                      <span className="font-medium">{listing.servings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{listing.category}</span>
                    </div>
                    {listing.distance !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">
                          {listing.distance > 1000
                            ? `${(listing.distance / 1000).toFixed(1)} km`
                            : `${Math.round(listing.distance)} m`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">
                        {listing.is_veg ? '🌱 Veg' : '🍖 Non-veg'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-2 mb-3">
                    <p className="text-xs text-gray-600 mb-1">📍 {listing.address}</p>
                    {listing.donor_name && (
                      <p className="text-xs text-gray-600">👤 {listing.donor_name}</p>
                    )}
                  </div>

                  {onListingClick && (
                    <button
                      onClick={() => onListingClick(listing.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                    >
                      🤝 Claim This Food
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}