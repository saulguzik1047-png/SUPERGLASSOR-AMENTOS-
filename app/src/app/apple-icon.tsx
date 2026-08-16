import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
        }}
      >
        <span style={{ fontSize: 80, fontWeight: 900, color: "white", letterSpacing: -2 }}>SG</span>
      </div>
    ),
    { ...size }
  );
}
