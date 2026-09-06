import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Covison, one calm, uncluttered home for every customer relationship.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The artwork is deliberately text-free (a designed background), so the
// wordmark and headline are still composed here rather than baked into
// the file, text rendered at export time stays crisp and stays editable.
// Read once at module scope: it doesn't depend on the request, so there's
// no reason to hit the filesystem per render.
const backgroundData = await readFile(join(process.cwd(), "public/og-image.png"), "base64");
const backgroundSrc = `data:image/png;base64,${backgroundData}`;

const markData = await readFile(join(process.cwd(), "public/logo-mark.png"), "base64");
const markSrc = `data:image/png;base64,${markData}`;

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
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders via Satori, not the browser; next/image doesn't apply here */}
        <img
          src={backgroundSrc}
          alt=""
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori render, not the browser DOM */}
          <img src={markSrc} alt="" width={56} height={56} />
          <span style={{ color: "#fff", fontSize: 32 }}>Covison</span>
        </div>

        <div style={{ display: "flex", marginTop: 56, position: "relative" }}>
          <span style={{ color: "#fff", fontSize: 60, lineHeight: 1.15, maxWidth: 900 }}>
            One calm, uncluttered home for every customer relationship.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
