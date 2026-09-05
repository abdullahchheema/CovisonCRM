import { ImageResponse } from "next/og";

export const alt = "Covison — one calm, uncluttered home for every customer relationship.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same fixed-hex constraint as icon.tsx: this renders standalone via
// Satori, so it can't read the app's CSS custom properties. Uses the
// --ink / --brand / --brand-violet light-mode values directly.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#120f1a",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(109,74,255,0.35), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6d4aff, #8b5cf6)",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <span style={{ color: "#fff", fontSize: 32 }}>Covison</span>
        </div>
        <div style={{ display: "flex", marginTop: 56 }}>
          <span
            style={{
              color: "#fff",
              fontSize: 60,
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            One calm, uncluttered home for every customer relationship.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
