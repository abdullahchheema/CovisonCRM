import { ImageResponse } from "next/og";

// Same mark as icon.tsx, at the size iOS expects for home-screen icons.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "linear-gradient(135deg, #6d4aff, #8b5cf6)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 108, fontWeight: 700 }}>C</span>
      </div>
    ),
    { ...size },
  );
}
