"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { MeetingPoint } from "@/types/database";

type Props = {
  meetingPoints: MeetingPoint[];
};

export default function RouteMap({ meetingPoints }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // lat/lng が両方ある点だけ抽出
  const points = meetingPoints.filter(
    (p): p is MeetingPoint & { lat: number; lng: number } =>
      typeof p.lat === "number" && typeof p.lng === "number"
  );

  useEffect(() => {
    if (!mapContainer.current) return;
    if (points.length === 0) return;
    if (mapRef.current) return; // 多重初期化防止

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_MAPTILER_API_KEY is not set");
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [points[0].lng, points[0].lat],
      zoom: 8,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapRef.current = map;

    map.on("load", () => {
      // ルートライン
      if (points.length >= 2) {
        const coordinates = points.map(
          (p) => [p.lng, p.lat] as [number, number]
        );
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#A8D547",
            "line-width": 3,
            "line-dasharray": [2, 1.5],
          },
        });
      }

      // マーカー
      points.forEach((p, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === points.length - 1;

        const el = document.createElement("div");
        el.style.width = isFirst || isLast ? "28px" : "22px";
        el.style.height = isFirst || isLast ? "28px" : "22px";
        el.style.borderRadius = "9999px";
        el.style.border = "2px solid #ffffff";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
        el.style.background = isLast
          ? "#A8D547"
          : isFirst
          ? "#1A2010"
          : "#9ca3af";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "#ffffff";
        el.style.fontSize = "11px";
        el.style.fontWeight = "700";
        el.style.cursor = "pointer";
        el.textContent = String(idx + 1);

        const popup = new maplibregl.Popup({
          offset: 16,
          closeButton: false,
        }).setHTML(
          `<div style="font-size:12px;line-height:1.4;">
             <div style="font-weight:600;">${escapeHtml(p.name)}</div>
             ${p.time ? `<div style="color:#6b7280;">${escapeHtml(p.time)}</div>` : ""}
             ${p.note ? `<div style="color:#6b7280;">${escapeHtml(p.note)}</div>` : ""}
           </div>`
        );

        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map);
      });

      // 全点が収まるように fitBounds
      if (points.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 50, duration: 0, maxZoom: 11 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        地図を表示するための位置情報が登録されていません。
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="h-72 w-full overflow-hidden rounded-lg border border-gray-200"
      style={{ minHeight: "288px" }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
