"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapComponentProps, MapMarker } from "./Map";

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fix default marker icon in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const userIcon = L.divIcon({
  className: "rounded-full bg-blue-500 border-2 border-white shadow",
  html: '<span style="width:14px;height:14px;display:block"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export interface MapProps extends MapComponentProps {}

function FitBounds({
  polyline,
  polylines,
  markers,
  userLocation,
}: {
  polyline?: [number, number][];
  polylines?: { positions: [number, number][] }[];
  markers?: MapMarker[];
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useMemo(() => {
    const points: [number, number][] = [];
    if (polyline?.length) points.push(...polyline.map(([lng, lat]) => [lat, lng] as [number, number]));
    polylines?.forEach((pl) => pl.positions?.forEach(([lng, lat]) => points.push([lat, lng])));
    markers?.forEach((m) => points.push([m.lat, m.lng]));
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (points.length >= 2) {
      map.fitBounds(points as L.LatLngBoundsLiteral, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, polyline, polylines, markers, userLocation]);
  return null;
}

export function MapInner({
  center,
  zoom = 13,
  markers = [],
  polyline,
  polylines = [],
  userLocation,
  onMarkerClick,
  onMapClick,
  clickToPin,
  className = "",
  height = "280px",
}: MapProps) {
  const polylineLatLng = useMemo(
    () => (polyline?.length ? polyline.map(([lng, lat]) => [lat, lng] as [number, number]) : []),
    [polyline]
  );

  return (
    <div
      className={className}
      style={{ height, cursor: clickToPin && onMapClick ? "crosshair" : undefined }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
        scrollWheelZoom
      >
        {onMapClick && clickToPin && <MapClickHandler onMapClick={onMapClick} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(polyline?.length || polylines?.length || markers?.length || userLocation) && (
          <FitBounds polyline={polyline} polylines={polylines} markers={markers} userLocation={userLocation} />
        )}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
        {markers.map((m) => (
          <Marker
            key={m.id ?? `${m.lat}-${m.lng}`}
            position={[m.lat, m.lng]}
            icon={icon}
            draggable={m.draggable ?? false}
            eventHandlers={{
              ...(m.id && onMarkerClick ? { click: () => onMarkerClick(m.id!) } : {}),
              ...(m.draggable && m.onDragEnd
                ? {
                    dragend: (e: L.LeafletEvent) => {
                      const pos = (e.target as L.Marker).getLatLng();
                      m.onDragEnd!(pos.lat, pos.lng);
                    },
                  }
                : {}),
            }}
          >
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {polylineLatLng.length > 1 && (
          <Polyline positions={polylineLatLng} color="#0d9488" weight={4} opacity={0.8} />
        )}
        {!polyline?.length && polylines.map((pl) =>
          pl.positions.length > 1 ? (
            <Polyline
              key={pl.id ?? pl.positions[0]?.join(",")}
              positions={pl.positions.map(([lng, lat]) => [lat, lng] as [number, number])}
              color="#0d9488"
              weight={3}
              opacity={0.7}
            />
          ) : null
        )}
      </MapContainer>
    </div>
  );
}
