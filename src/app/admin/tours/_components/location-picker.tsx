"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

type Props = {
  open: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  initialName?: string;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
};

type GeocodeFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
};

export default function LocationPicker({
  open,
  initialLat,
  initialLng,
  initialName,
  onClose,
  onSelect,
}: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [selectedLat, setSelectedLat] = useState<number | null>(
    initialLat ?? null
  );
  const [selectedLng, setSelectedLng] = useState<number | null>(
    initialLng ?? null
  );

  const [searchInput, setSearchInput] = useState<string>(initialName ?? "");
  const [searchResults, setSearchResults] = useState<GeocodeFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // モーダルが閉じている間は何もしない
  useEffect(() => {
    if (!open) return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_MAPTILER_API_KEY is not set");
      return;
    }

    // 初期中心：既存座標 or 新宿
    const initCenter: [number, number] =
      typeof initialLng === "number" && typeof initialLat === "number"
        ? [initialLng, initialLat]
        : [139.6995, 35.6896];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: initCenter,
      zoom: typeof initialLat === "number" ? 13 : 9,
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

    // 既存の座標があれば最初からピンを立てる
    if (typeof initialLat === "number" && typeof initialLng === "number") {
      const marker = new maplibregl.Marker({ color: "#A8D547" })
        .setLngLat([initialLng, initialLat])
        .addTo(map);
      markerRef.current = marker;
    }

    // 地図クリックでピン更新
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLat(lat);
      setSelectedLng(lng);

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const marker = new maplibregl.Marker({ color: "#A8D547" })
          .setLngLat([lng, lat])
          .addTo(map);
        markerRef.current = marker;
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 検索実行
  const runSearch = async () => {
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) return;
    const q = searchInput.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
        q
      )}.json?key=${apiKey}&language=ja&country=jp&limit=8`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`検索に失敗しました (${res.status})`);
      }
      const json = (await res.json()) as { features?: GeocodeFeature[] };
      const features = json.features ?? [];
      if (features.length === 0) {
        setSearchError("該当する地点が見つかりませんでした");
      }
      setSearchResults(features);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "検索エラー");
    } finally {
      setIsSearching(false);
    }
  };

  // 検索結果クリック → 地図移動 + ピン
  const pickFeature = (f: GeocodeFeature) => {
    const [lng, lat] = f.center;
    setSelectedLat(lat);
    setSelectedLng(lng);

    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: 14, duration: 600 });

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const marker = new maplibregl.Marker({ color: "#A8D547" })
        .setLngLat([lng, lat])
        .addTo(map);
      markerRef.current = marker;
    }
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (selectedLat == null || selectedLng == null) return;
    onSelect(selectedLat, selectedLng);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper-50 w-full max-w-2xl max-h-[90vh] flex flex-col border border-line shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
              Pick Location
            </p>
            <h3 className="mt-1 font-serif text-lg tracking-[0.04em] text-ink-900">
              地図で位置を選ぶ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900"
          >
            閉じる
          </button>
        </div>

        {/* 検索 */}
        <div className="px-5 py-3 border-b border-line space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch();
                }
              }}
              placeholder="例：新宿西口、海老名SA"
              className="flex-1 bg-paper-100 border border-line px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={isSearching || !searchInput.trim()}
              className="bg-ink-900 text-paper-100 text-[12px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-coral-700 transition disabled:opacity-50"
            >
              {isSearching ? "検索中..." : "検索"}
            </button>
          </div>
          {searchError && (
            <p className="text-[11px] text-coral-700">{searchError}</p>
          )}
          {searchResults.length > 0 && (
            <ul className="border border-line bg-paper-100 max-h-40 overflow-y-auto divide-y divide-line">
              {searchResults.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => pickFeature(f)}
                    className="w-full text-left px-3 py-2 text-[13px] text-ink-900 hover:bg-paper-200 transition"
                  >
                    <div className="font-serif">{f.text}</div>
                    <div className="text-[11px] text-ink-500 font-light">
                      {f.place_name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 地図 */}
        <div className="flex-1 min-h-[300px] relative">
          <div
            ref={mapContainer}
            className="absolute inset-0"
            style={{ minHeight: "300px" }}
          />
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-line flex items-center justify-between gap-3">
          <div className="text-[11px] text-ink-500 font-light">
            {selectedLat != null && selectedLng != null ? (
              <>
                選択中:{" "}
                <span className="font-mono text-ink-900">
                  {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}
                </span>
              </>
            ) : (
              "地図をタップ、または検索で地点を選んでください"
            )}
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedLat == null || selectedLng == null}
            className="bg-coral-500 hover:bg-coral-700 text-paper-100 text-[12px] tracking-[0.15em] uppercase px-5 py-2 transition disabled:opacity-50"
          >
            この位置で決定
          </button>
        </div>
      </div>
    </div>
  );
}
