import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Browser-tab icon, generated rather than shipped as a binary so it stays
// in step with the mark in public/, which comes in as a data URI since
// Satori renders outside any page's cascade.
//
// No plate behind it: the mark is a saturated violet with transparency, so
// it reads on both light and dark browser chrome and can fill the whole
// frame instead of sitting inside a box. At 32px every pixel counts.
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori render, not the browser DOM */}
        <img src={markSrc} alt="" width={32} height={32} />
      </div>
    ),
    { ...size },
  );
}
