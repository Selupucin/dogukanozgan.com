// @do/db — Güvenilir istemci IP çıkarımı. Kaynak: docs/13 §D1.
//
// NEDEN: Eskiden her app `x-forwarded-for`'un ilk değerine güveniyordu; bu başlık
// istemci tarafından spoof edilebilir. Vercel arkasında ÇALIŞIRKEN Vercel kendi
// güvenilir başlığını (`x-vercel-forwarded-for`) ekler — bunu tercih ederiz. Yoksa
// `x-forwarded-for`'un İLK değerine düşeriz (yerel/diğer ortamlar), son çare `x-real-ip`.
//
// Tek merkezi yardımcı: rate-limit anahtarları + KVKK rıza IP kanıtı bunu kullanır,
// böylece tüm uygulama tutarlı ve daha zor spoof edilen bir IP'ye dayanır.
//
// Çerçeveden bağımsızdır: yalnız standart `Headers` (veya benzeri) alır.

interface HeaderLike {
  get(name: string): string | null;
}

/**
 * İstek başlıklarından güvenilir istemci IP'sini çıkarır.
 * Öncelik: x-vercel-forwarded-for → x-forwarded-for (ilk) → x-real-ip → "unknown".
 */
export function getClientIp(headers: HeaderLike): string {
  // Vercel'in eklediği güvenilir başlık (varsa en güvenilir kaynak).
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }

  // Standart proxy başlığı: ilk değer orijinal istemcidir.
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip") ?? "unknown";
}
