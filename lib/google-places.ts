/**
 * Google Places Autocomplete integration.
 * Set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY and enable "Places API" and "Maps JavaScript API"
 * in Google Cloud Console. Restrict the key by HTTP referrer for client-side use.
 */

// Minimal Window type for Google Places (avoids complex callback types that can break parsers)
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => {
            getPlacePredictions(request: unknown, callback: (a: unknown, b: string) => void): void;
          };
          PlacesService: new (attrContainer: HTMLDivElement) => {
            getDetails(request: unknown, callback: (a: unknown, b: string) => void): void;
          };
        };
      };
    };
  }
}

const SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
let loadPromise: Promise<void> | null = null;

export function getGooglePlacesApiKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() || undefined;
}

/** Load the Google Maps script with Places library. Call once before using suggestions. */
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places?.AutocompleteService) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${SCRIPT_URL}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps?.places?.AutocompleteService) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement("script");
    script.src = `${SCRIPT_URL}?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const poll = setInterval(() => {
        if (window.google?.maps?.places?.AutocompleteService) {
          clearInterval(poll);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(poll);
        if (!window.google?.maps?.places?.AutocompleteService) reject(new Error("Google Places failed to load"));
      }, 10000);
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export interface GooglePlacePrediction {
  placeId: string;
  description: string;
}

/** Get place autocomplete predictions (requires script loaded and API key). */
export function getGooglePlacePredictions(
  query: string,
  options?: { nearLat?: number; nearLng?: number; country?: string }
): Promise<GooglePlacePrediction[]> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey || !query?.trim() || query.trim().length < 2) return Promise.resolve([]);
  if (!window.google?.maps?.places?.AutocompleteService) {
    return loadGoogleMapsScript(apiKey).then(() =>
      getGooglePlacePredictions(query, options)
    );
  }
  return new Promise((resolve) => {
    const service = new window.google!.maps.places.AutocompleteService();
    const request: {
      input: string;
      bounds?: { north: number; south: number; east: number; west: number };
      componentRestrictions?: { country: string };
    } = {
      input: query.trim(),
    };
    if (options?.country) {
      request.componentRestrictions = { country: options.country };
    } else {
      request.componentRestrictions = { country: "us" };
    }
    if (options?.nearLat != null && options?.nearLng != null) {
      const d = 0.5;
      request.bounds = {
        north: options.nearLat + d,
        south: options.nearLat - d,
        east: options.nearLng + d,
        west: options.nearLng - d,
      };
    }
    service.getPlacePredictions(request, (predictions, status) => {
      if (status !== "OK") {
        resolve([]);
        return;
      }
      const list = ((predictions as { place_id: string; description: string }[] | null) || []).map((p) => ({
        placeId: p.place_id,
        description: p.description,
      }));
      resolve(list);
    });
  });
}

export interface GooglePlaceDetails {
  lat: number;
  lng: number;
  displayName: string;
}

/** Get place details (lat, lng, address) by place_id. Requires a div in the DOM for PlacesService. */
export function getGooglePlaceDetails(
  placeId: string,
  containerDiv: HTMLDivElement
): Promise<GooglePlaceDetails | null> {
  if (!placeId || !window.google?.maps?.places?.PlacesService) return Promise.resolve(null);
  return new Promise((resolve) => {
    const service = new window.google.maps.places.PlacesService(containerDiv);
    service.getDetails(
      {
        placeId,
        fields: ["geometry", "formatted_address", "name"],
      },
      (place, status) => {
        const p = place as {
          geometry?: { location?: { lat: () => number; lng: () => number } };
          formatted_address?: string;
          name?: string;
        } | null;
        if (status !== "OK" || !p?.geometry?.location) {
          resolve(null);
          return;
        }
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        const displayName =
          p.formatted_address || p.name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        resolve({ lat, lng, displayName });
      }
    );
  });
}
