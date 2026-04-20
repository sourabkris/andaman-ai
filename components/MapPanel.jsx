"use client";

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

/**
 * MapPanel component — renders the Google Maps view of the itinerary.
 * Plots markers and polylines for each day's places when an itinerary is provided.
 * Cleans up all map overlays on unmount.
 *
 * @param {Object} props
 * @param {Object|null} props.itinerary - The structured itinerary from Gemini
 */
export default function MapPanel({ itinerary }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [polylines, setPolylines] = useState([]);
  const [placesService, setPlacesService] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
        v: "weekly",
      });

      try {
        const { Map } = await importLibrary("maps");
        const { PlacesService } = await importLibrary("places");

        const newMap = new Map(mapRef.current, {
          center: { lat: 11.6765, lng: 92.7302 }, // Port Blair
          zoom: 9,
          mapId: "ANDAMAN_TRAVEL_MAP",
        });

        setMap(newMap);
        setPlacesService(new PlacesService(newMap));
      } catch (err) {
        console.error("Map initialization failed", err);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || !placesService || !itinerary || !itinerary.days) return;

    // Clear existing overlays
    markers.forEach(m => m.setMap(null));
    polylines.forEach(p => p.setMap(null));

    const newMarkers = [];
    const newPolylines = [];

    if (typeof google === 'undefined') return;

    const bounds = new google.maps.LatLngBounds();
    const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#be123c'];

    const processPlaces = async () => {
      for (const [dayIndex, day] of itinerary.days.entries()) {
        const color = colors[dayIndex % colors.length];

        // EFFICIENCY: Resolve all places for this day in parallel
        const locationPromises = day.places.map(place => {
          const request = {
            query: `${place.name}, ${day.location}, Andaman and Nicobar Islands`,
            fields: ['name', 'geometry'],
          };

          return new Promise((resolve) => {
            placesService.findPlaceFromQuery(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry) {
                resolve({ location: results[0].geometry.location, place });
              } else {
                const fallbackRequest = { query: `${place.name}, Andaman`, fields: ['geometry'] };
                placesService.findPlaceFromQuery(fallbackRequest, (res, st) => {
                  if (st === google.maps.places.PlacesServiceStatus.OK && res?.[0]?.geometry) {
                    resolve({ location: res[0].geometry.location, place });
                  } else {
                    resolve(null);
                  }
                });
              }
            });
          });
        });

        const resolvedLocations = await Promise.all(locationPromises);
        const dayCoordinates = [];

        resolvedLocations.forEach(result => {
          if (result) {
            const { location, place } = result;
            dayCoordinates.push(location);
            bounds.extend(location);

            const marker = new google.maps.Marker({
              map,
              position: location,
              title: place.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }
            });
            newMarkers.push(marker);

            const infoWindow = new google.maps.InfoWindow({
              content: `<div class="p-2 max-w-xs text-black"><b>Day ${day.day}: ${place.name}</b><br/>${place.time} - ${place.duration}<br/><i class="text-xs text-gray-500">${place.description}</i></div>`
            });
            marker.addListener('click', () => {
              infoWindow.open({ anchor: marker, map });
            });
          }
        });

        if (dayCoordinates.length > 1) {
          const polyline = new google.maps.Polyline({
            path: dayCoordinates,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: map
          });
          newPolylines.push(polyline);
        }
      }

      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        if (map.getZoom() > 14) map.setZoom(14);
      }
      setMarkers(newMarkers);
      setPolylines(newPolylines);
    };

    processPlaces();

    // Cleanup: remove overlays when itinerary changes or component unmounts
    return () => {
      newMarkers.forEach(m => m.setMap(null));
      newPolylines.forEach(p => p.setMap(null));
    };
  }, [itinerary, map, placesService]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article className="w-full h-full relative bg-gray-50" aria-label="Interactive Map Display">
       {!itinerary && (
         <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
           <div className="text-center p-5 md:p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-sm w-full mx-auto" aria-live="polite">
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657h.01M21 12c0 4.97-8 12-8 12s-8-7.03-8-12a8 8 0 1116 0z" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
             </div>
             <h2 className="text-xl font-bold text-gray-800">Interactive Map</h2>
             <p className="text-gray-500 text-sm mt-2">Generate an itinerary in the chat to see your route marked automatically.</p>
           </div>
         </div>
       )}
       {/* role="application" is appropriate for interactive widgets like maps */}
       <div
         role="application"
         aria-label="Google Maps plotting your itinerary"
         className="w-full h-full"
       >
         <div ref={mapRef} className="w-full h-full" tabIndex={0} aria-label="Map canvas" />
       </div>
    </article>
  );
}
