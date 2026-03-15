"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./MapInner";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  id?: string;
  /** When true, marker can be dragged; onDragEnd is called with new lat/lng */
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
}

export interface MapPolyline {
  id?: string;
  positions: [number, number][]; // [lng, lat] per point
}

export interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  polyline?: [number, number][]; // [lng, lat] for Leaflet (single)
  polylines?: MapPolyline[]; // multiple routes
  userLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (id: string) => void;
  /** Called when user clicks on the map (lat, lng). Use for pin-to-set-location. */
  onMapClick?: (lat: number, lng: number) => void;
  /** When true, map shows a cursor pointer and listens for click to set location */
  clickToPin?: boolean;
  className?: string;
  height?: string;
}

const loadingPlaceholder = (
  <div className="flex items-center justify-center rounded-xl bg-stone-100 text-stone-500" style={{ minHeight: 280 }}>
    Loading map…
  </div>
);

const MapInnerLeaflet = dynamic(() => import("./MapInner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => loadingPlaceholder,
});

const MapInnerGoogle = dynamic(
  () => import("./GoogleMapInner").then((m) => m.GoogleMapInner),
  { ssr: false, loading: () => loadingPlaceholder }
);

/** Use Google Maps when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set; otherwise OpenStreetMap (Leaflet). */
export function Map(props: MapComponentProps) {
  const useGoogleMaps = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return useGoogleMaps ? <MapInnerGoogle {...props} /> : <MapInnerLeaflet {...props} />;
}
