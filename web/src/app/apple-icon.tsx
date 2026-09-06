import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Same mark as icon.tsx, at the size iOS uses for home-screen icons.
// This one keeps the --ink plate: iOS composites home-screen icons onto an
// opaque square regardless, so a transparent background would just come out
// black rather than adopting the wallpaper.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const markData = await readFile(join(process.cwd(), "public/logo-mark.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

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
          background: "#120f1a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori render, not the browser DOM */}
        <img src={markSrc} alt="" width={144} height={144} />
      </div>
    ),
    { ...size },
  );
}
