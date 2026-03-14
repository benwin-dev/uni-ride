"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { suggestPlaces } from "@/lib/map-utils";
import type { GeoResult } from "@/lib/map-utils";
import {
  getGooglePlacesApiKey,
  getGooglePlacePredictions,
  getGooglePlaceDetails,
} from "@/lib/google-places";

/** Unified suggestion: from Google (placeId) or from Nominatim/Photon (lat, lng) */
type SuggestionItem =
  | { displayName: string; placeId: string; lat?: never; lng?: never }
  | { displayName: string; lat: number; lng: number; placeId?: never };

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Bias suggestions near this location (e.g. user's current position) */
  nearLat?: number;
  nearLng?: number;
}

export function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search for a place or address",
  disabled,
  id,
  "aria-label": ariaLabel,
  nearLat,
  nearLng,
}: LocationSearchInputProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placesServiceRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef<Map<string, SuggestionItem[]>>(new Map());
  // Free by default: Nominatim + Photon (no API key). Set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to use Google.
  const useGoogle = !!getGooglePlacesApiKey();

  useEffect(() => {
    const query = value.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const cacheKey = `${query.toLowerCase()}|${nearLat ?? "na"}|${nearLng ?? "na"}|${useGoogle ? "g" : "n"}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && cached.length > 0) {
      setSuggestions(cached);
      setHighlight(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        if (useGoogle) {
          const list = await getGooglePlacePredictions(query, {
            nearLat: nearLat ?? undefined,
            nearLng: nearLng ?? undefined,
            country: "us",
          });
          if (reqId !== requestIdRef.current) return;
          const items: SuggestionItem[] = list.map((p) => ({
            displayName: p.description,
            placeId: p.placeId,
          }));
          if (items.length > 0) cacheRef.current.set(cacheKey, items);
          setSuggestions(items);
        } else {
          let results = await suggestPlaces(query, {
            nearLat: nearLat ?? undefined,
            nearLng: nearLng ?? undefined,
          });
          if (results.length === 0 && nearLat != null && nearLng != null) {
            results = await suggestPlaces(query);
          }
          if (reqId !== requestIdRef.current) return;
          const items: SuggestionItem[] = results.map((r: GeoResult) => ({
            displayName: r.displayName,
            lat: r.lat,
            lng: r.lng,
          }));
          if (items.length > 0) cacheRef.current.set(cacheKey, items);
          setSuggestions(items);
        }
        setHighlight(0);
      } finally {
        setLoading(false);
        debounceRef.current = null;
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, nearLat, nearLng, useGoogle]);

  const handleSelect = useCallback(
    async (s: SuggestionItem) => {
      if ("placeId" in s && s.placeId && placesServiceRef.current) {
        setDetailLoading(true);
        try {
          const details = await getGooglePlaceDetails(s.placeId, placesServiceRef.current);
          if (details) onChange(details.displayName, details.lat, details.lng);
        } finally {
          setDetailLoading(false);
        }
      } else if ("lat" in s && s.lat != null && s.lng != null) {
        onChange(s.displayName, s.lat, s.lng);
      }
      setSuggestions([]);
      setIsFocused(false);
    },
    [onChange]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when 2+ chars and (focused OR we already have suggestions so user can click one)
  const menuVisible = value.trim().length >= 2 && (isFocused || suggestions.length > 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && (!menuVisible || suggestions.length === 0)) {
      e.preventDefault();
      onChange(value.trim());
      setIsFocused(false);
      return;
    }
    if (!menuVisible || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      handleSelect(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setSuggestions([]);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        ref={placesServiceRef}
        aria-hidden
        className="absolute h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
        style={{ position: "absolute", left: -9999 }}
      />
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={menuVisible}
        aria-controls={menuVisible ? "location-suggestions" : undefined}
        className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 pr-8 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      {(loading || detailLoading) && (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
          aria-hidden
        >
          …
        </span>
      )}
      {menuVisible && (
        <ul
          id="location-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-xl"
        >
          {loading ? (
            <li className="px-4 py-2.5 text-sm text-stone-500">Searching suggestions...</li>
          ) : detailLoading ? (
            <li className="px-4 py-2.5 text-sm text-stone-500">Getting place details...</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <li
                key={"placeId" in s ? s.placeId : `${s.lat}-${s.lng}-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={`cursor-pointer px-4 py-2.5 text-sm text-stone-700 hover:bg-teal-50 ${
                  i === highlight ? "bg-teal-50" : ""
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                {s.displayName}
              </li>
            ))
          ) : (
            <>
              {!loading && (
                <>
                  <li className="px-4 py-2 text-xs text-stone-500">No suggestions found yet.</li>
                  <li
                    role="option"
                    aria-selected={false}
                    className="cursor-pointer px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(value.trim());
                      setIsFocused(false);
                    }}
                  >
                    Use &quot;{value.trim()}&quot;
                  </li>
                </>
              )}
            </>
          )}
        </ul>
      )}
      {value.trim().length === 1 && (
        <p className="mt-1 text-xs text-stone-500">Keep typing for place suggestions (e.g. Western Michigan University).</p>
      )}
      {value.trim().length >= 2 && !loading && (
        <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
          <span>Tip: press Enter to use exactly what you typed.</span>
          <button
            type="button"
            onClick={() => {
              onChange(value.trim());
              setIsFocused(false);
            }}
            className="rounded border border-stone-300 px-2 py-0.5 text-stone-700 hover:bg-stone-50"
          >
            Use typed address
          </button>
        </div>
      )}
    </div>
  );
}
