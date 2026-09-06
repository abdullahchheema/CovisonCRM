import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Browser-tab icon, generated rather than shipped as a binary so it stays
// in step with the mark in public/. Satori renders this outside any page's
// cascade, so it can't read the design tokens — the plate colour is the
// literal --ink value, and the mark comes in as a data URI.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const markData = await readFile(join(process.cwd(), "public/logo-mark.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "#120f1a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori render, not the browser DOM */}
        <img src={markSrc} alt="" width={24} height={24} />
      </div>
    ),
    { ...size },
  );
}
