"use client";
import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, useTheme } from "@mui/material";
// Free OpenStreetMap vector tiles with no key; swap in another MapLibre style
// (e.g. Geoapify, MapTiler) through NEXT_PUBLIC_MAP_STYLE_URL.
const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  "https://tiles.openfreemap.org/styles/liberty";
const ZOOM = 17;
/** 6 decimals is about 10 cm, plenty for a restaurant entrance. */
const round = (value: number) => Math.round(value * 1e6) / 1e6;
interface Props {
  latitude: number;
  longitude: number;
  /** Called after the pin is dragged or the map is tapped. */
  onMove: (latitude: number, longitude: number) => void;
  /** Shows the pin without letting it be moved. */
  readOnly?: boolean;
  height?: number;
}
/** Map with a draggable pin for the restaurant's exact position. */
export function LocationMap({
  latitude,
  longitude,
  onMove,
  readOnly = false,
  height,
}: Props) {
  const theme = useTheme(),
    container = useRef<HTMLDivElement>(null),
    map = useRef<MapLibreMap>(undefined),
    marker = useRef<Marker>(undefined),
    onMoveRef = useRef(onMove),
    // The map is built once; later position changes go through the effect below.
    initial = useRef({
      latitude,
      longitude,
      color: theme.palette.primary.main,
      readOnly,
    });
  useEffect(() => {
    onMoveRef.current = onMove;
  });
  useEffect(() => {
    let cancelled = false;
    // maplibre-gl needs the browser, so it is loaded only on the client.
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !container.current) return;
      const { Map, Marker, NavigationControl } = maplibre;
      // Copied to /public by scripts/copy-maplibre-worker.mjs; the version
      // query busts the browser cache after a maplibre-gl upgrade.
      maplibre.setWorkerUrl(
        `/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`,
      );
      const { latitude, longitude, color, readOnly } = initial.current,
        center: [number, number] = [longitude, latitude];
      const created = new Map({
        container: container.current,
        style: STYLE_URL,
        center,
        zoom: ZOOM,
        attributionControl: { compact: true },
      });
      if (!readOnly)
        created.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );
      const pin = new Marker({ draggable: !readOnly, color })
        .setLngLat(center)
        .addTo(created);
      const report = () => {
        const { lat, lng } = pin.getLngLat();
        onMoveRef.current(round(lat), round(lng));
      };
      if (!readOnly) {
        pin.on("dragend", report);
        created.on("click", (e) => {
          pin.setLngLat(e.lngLat);
          report();
        });
      }
      map.current = created;
      marker.current = pin;
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = undefined;
      marker.current = undefined;
    };
  }, []);
  // A new search result moves the pin; the vendor's own drag already has.
  useEffect(() => {
    const pin = marker.current;
    if (!pin) return;
    const at = pin.getLngLat();
    if (
      Math.abs(at.lat - latitude) < 1e-6 &&
      Math.abs(at.lng - longitude) < 1e-6
    )
      return;
    pin.setLngLat([longitude, latitude]);
    map.current?.flyTo({ center: [longitude, latitude], zoom: ZOOM });
  }, [latitude, longitude]);
  return (
    <Box
      ref={container}
      role="region"
      aria-label="Map. Drag the pin, or tap the map, to set your restaurant's exact location."
      sx={{
        height: height ?? { xs: 280, sm: 340 },
        borderRadius: "12px",
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    />
  );
}
