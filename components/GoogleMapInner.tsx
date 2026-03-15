"use client";

import { useMemo, useEffect, useCallback } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Polyline,
  useGoogleMap,
} from "@react-google-maps/api";
import type { MapComponentProps, MapMarker } from "./Map";

const DEFAULT_CENTER = { lat: 37.8719, lng: -122.2585 };

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
  const map = useGoogleMap();
  useEffect(() => {
    if (!map) return;
    const points: { lat: number; lng: number }[] = [];
    polyline?.forEach(([lng, lat]) => points.push({ lat, lng }));
    polylines?.forEach((pl) =>
      pl.positions?.forEach(([lng, lat]) => points.push({ lat, lng }))
    );
    markers?.forEach((m) => points.push({ lat: m.lat, lng: m.lng }));
    if (userLocation) points.push(userLocation);
    if (points.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [map, polyline, polylines, markers, userLocation]);
  return null;
}

export function GoogleMapInner({
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
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  const centerLatLng = useMemo(
    () => ({ lat: center[0], lng: center[1] }),
    [center[0], center[1]]
  );

  const polylinePath = useMemo(() => {
    if (polyline?.length) {
      return polyline.map(([lng, lat]) => ({ lat, lng }));
    }
    return [];
  }, [polyline]);

  const mapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (clickToPin && onMapClick && e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    },
    [clickToPin, onMapClick]
  );

  if (!apiKey || loadError || !isLoaded) {
    return (
      <div
        className={className}
        style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f4", borderRadius: 12 }}
      >
        <span className="text-stone-500 text-sm">
          {!apiKey ? "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps." : "Loading map…"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ height, cursor: clickToPin && onMapClick ? "crosshair" : undefined }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 12 }}
        center={centerLatLng}
        zoom={zoom}
        onClick={mapClick}
        options={{ scrollwheel: true }}
      >
        {(polyline?.length || polylines?.length || markers?.length || userLocation) && (
          <FitBounds
            polyline={polyline}
            polylines={polylines}
            markers={markers}
            userLocation={userLocation}
          />
        )}
        {userLocation && (
          <Marker
            position={userLocation}
            title="You are here"
            zIndex={10}
          />
        )}
        {markers.map((m) => (
          <Marker
            key={m.id ?? `${m.lat}-${m.lng}`}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
            draggable={m.draggable ?? false}
            onClick={m.id && onMarkerClick ? () => onMarkerClick(m.id!) : undefined}
            onDragEnd={
              m.draggable && m.onDragEnd
                ? (e) => {
                    const pos = e.latLng;
                    if (pos) m.onDragEnd!(pos.lat(), pos.lng());
                  }
                : undefined
            }
          />
        ))}
        {polylinePath.length > 1 && (
          <Polyline
            path={polylinePath}
            options={{
              strokeColor: "#0d9488",
              strokeWeight: 4,
              strokeOpacity: 0.8,
            }}
          />
        )}
        {!polyline?.length &&
          polylines?.map((pl) =>
            pl.positions.length > 1 ? (
              <Polyline
                key={pl.id ?? pl.positions[0]?.join(",")}
                path={pl.positions.map(([lng, lat]) => ({ lat, lng }))}
                options={{
                  strokeColor: "#0d9488",
                  strokeWeight: 3,
                  strokeOpacity: 0.7,
                }}
              />
            ) : null
          )}
      </GoogleMap>
    </div>
  );
}
