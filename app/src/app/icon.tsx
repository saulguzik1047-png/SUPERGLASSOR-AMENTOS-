import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
          borderRadius: 96,
        }}
      >
        <span style={{ fontSize: 220, fontWeight: 900, color: "white", letterSpacing: -4 }}>SG</span>
      </div>
    ),
    { ...size }
  );
}
