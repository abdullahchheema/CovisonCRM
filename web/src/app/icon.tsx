import { ImageResponse } from "next/og";

// Replaces the default (unbranded) favicon.ico with a generated one, built
// from the same brand-gradient tile as CovisonMark — generated code
// instead of a binary asset, consistent with this redesign's "no image
// assets" approach everywhere else. Fixed hex values here (not CSS custom
// properties): ImageResponse renders standalone via Satori, outside any
// page's cascade, so the design tokens it would otherwise read aren't
// available — these are the light-mode --brand / --brand-violet values.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          borderRadius: 9,
          background: "linear-gradient(135deg, #6d4aff, #8b5cf6)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>C</span>
      </div>
    ),
    { ...size },
  );
}
