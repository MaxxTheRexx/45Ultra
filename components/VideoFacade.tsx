"use client";

import { useState } from "react";
import { isOffline } from "@/lib/hooks";
import { IconPlay } from "./icons";
import type { VideoEntry } from "@/lib/content/videos";

/**
 * Klick-zum-Laden-Fassade: erst Thumbnail (kein YouTube-JS/Tracking vor Klick),
 * dann youtube-nocookie-iframe. Offline oder bei gesperrter Einbettung:
 * "Auf YouTube ansehen"-Link.
 */
export function VideoFacade({ video }: { video: VideoEntry }) {
  const [play, setPlay] = useState(false);
  const offline = isOffline();
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

  return (
    <div className="recipe" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#111" }}>
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        ) : (
          <button
            onClick={() => { if (!offline) setPlay(true); }}
            aria-label={`Video abspielen: ${video.title}`}
            style={{
              width: "100%", height: "100%", border: 0, padding: 0, cursor: offline ? "default" : "pointer",
              backgroundImage: `url(https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg)`,
              backgroundSize: "cover", backgroundPosition: "center", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{
              width: 54, height: 54, borderRadius: "50%", background: "var(--orange)",
              border: "2px solid #111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "3px 3px 0 #111",
            }}>
              <IconPlay size={22} />
            </span>
          </button>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div className="r-tag">{video.topic}</div>
        <h4 style={{ marginBottom: 4 }}>{video.title}</h4>
        <div className="r-time">
          {video.channel} · <a href={watchUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--orange)", fontWeight: 700 }}>Auf YouTube ansehen ↗</a>
        </div>
      </div>
    </div>
  );
}
