// Admin favicon — wordmark "DÖ" (docs/09). ImageResponse ile dinamik üretim.
// Web ikonundan ayırt edilsin diye harfler TEAL (#1c6e6a) — admin/yönetim vurgusu.
// Bu dosya /favicon.ico 404'ünü de giderir (Next icon route'u link'i sağlar).

import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#10243a",
        borderRadius: 14,
        color: "#1c6e6a",
        fontSize: 34,
        fontWeight: 700,
        fontFamily: "Georgia, 'Times New Roman', serif",
        letterSpacing: -1,
      }}
    >
      DÖ
    </div>,
    { ...size },
  );
}
