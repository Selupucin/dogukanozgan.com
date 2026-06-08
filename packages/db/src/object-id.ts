// @do/db — MongoDB ObjectId doğrulama yardımcısı (docs/13 §O1).
//
// SORUN: Geçersiz bir id (24 hex hane değil) doğrudan Prisma sorgusuna verilirse
// Prisma "Malformed ObjectID" fırlatır; bu hem yanıltıcı "DB'ye ulaşılamadı"
// mesajına hem de kontrolsüz hata yüzeyine yol açar.
//
// KULLANIM: id/quoteId alan her Server Action ve sorgu, Prisma'ya geçmeden ÖNCE
// `isValidObjectId(id)` ile doğrular; geçersizse erken (ör. { ok:false } / null) döner.

/** MongoDB ObjectId 24 hex hane mi? (büyük/küçük harf duyarsız) */
export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
}
