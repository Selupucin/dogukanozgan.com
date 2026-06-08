"use server";

// Teklif detayı Server Action'ları — durum değiştir, not ekle, sil, anonimleştir.
// Kaynak: docs/05 (CRM durum/not, KVKK sil/anonimleştir), docs/06 (erişim güvenliği).
//
// GÜVENLİK: Her action başında oturum kontrolü (docs/05 "Tüm admin server
// action'larında oturum kontrolü"). Oturum yoksa işlem reddedilir.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  prisma,
  deleteQuoteRequest,
  anonymizeQuoteRequest,
  setPolicyDates,
  attachPolicyDocument,
  uploadToStorage,
  isStorageConfigured,
  validateUpload,
  signFileToken,
  isValidObjectId,
  logError,
  type QuoteStatus,
} from "@do/db";
import { isEmailConfigured, sendPolicyDelivery } from "@do/email";
import { auth } from "@/auth";
import { canTransition, QUOTE_STATUSES, productLabel } from "@/lib/crm";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Yetkisiz: oturum gerekli.");
  }
  return session;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Geçerli bir tarih (YYYY-MM-DD) parse eder; boş/hatalıysa null. */
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * CRM durumunu değiştirir (docs/05 akışına göre geçiş doğrulanır).
 * POLICE_YAPILDI'ya geçişte poliçe başlangıç + bitiş tarihi ZORUNLUDUR (K32 / docs/12):
 * tarihsiz POLICE_YAPILDI'ya izin verilmez.
 */
export async function updateStatusAction(
  quoteId: string,
  next: string,
  policy?: { start?: string | null; end?: string | null },
): Promise<ActionResult> {
  await requireAuth();

  // ObjectId guard (docs/13 §O1) — geçersizse Prisma "Malformed ObjectID" fırlatmasın.
  if (!isValidObjectId(quoteId)) return { ok: false, error: "Geçersiz teklif." };

  if (!QUOTE_STATUSES.includes(next as QuoteStatus)) {
    return { ok: false, error: "Geçersiz durum." };
  }
  const target = next as QuoteStatus;

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    select: { status: true },
  });
  if (!quote) return { ok: false, error: "Teklif bulunamadı." };

  if (!canTransition(quote.status, target)) {
    return { ok: false, error: "Bu duruma geçiş yapılamaz." };
  }

  // POLICE_YAPILDI → başlangıç + bitiş tarihi zorunlu (K32).
  let start: Date | null = null;
  let end: Date | null = null;
  if (target === "POLICE_YAPILDI") {
    start = parseDate(policy?.start);
    end = parseDate(policy?.end);
    if (!start || !end) {
      return { ok: false, error: "Poliçe başlangıç ve bitiş tarihi zorunludur." };
    }
    if (end <= start) {
      return { ok: false, error: "Bitiş tarihi başlangıçtan sonra olmalıdır." };
    }
  }

  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: { status: target }, // updatedAt @updatedAt ile otomatik (docs/05).
  });

  // Tarihler durum güncellemesinden sonra ayarlanır (POLICE_YAPILDI akışı, docs/12).
  if (target === "POLICE_YAPILDI") {
    await setPolicyDates(quoteId, { start, end });
  }

  revalidatePath(`/teklifler/${quoteId}`);
  revalidatePath("/teklifler");
  revalidatePath("/policeler");
  return { ok: true };
}

/**
 * Mevcut POLICE_YAPILDI teklifine sonradan poliçe tarihi girer/günceller (K32 / docs/12).
 * Tarihsiz kaydı düzeltmek için. Durum kontrolü: yalnız POLICE_YAPILDI'da anlamlı.
 */
export async function setPolicyDatesAction(
  quoteId: string,
  startStr: string,
  endStr: string,
): Promise<ActionResult> {
  await requireAuth();

  if (!isValidObjectId(quoteId)) return { ok: false, error: "Geçersiz teklif." };

  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end) return { ok: false, error: "Geçerli başlangıç ve bitiş tarihi girin." };
  if (end <= start) return { ok: false, error: "Bitiş tarihi başlangıçtan sonra olmalıdır." };

  const updated = await setPolicyDates(quoteId, { start, end });
  if (!updated) return { ok: false, error: "Teklif bulunamadı." };

  revalidatePath(`/teklifler/${quoteId}`);
  revalidatePath("/policeler");
  return { ok: true };
}

/** Zaman damgalı not ekler (Note modeli). */
export async function addNoteAction(quoteId: string, body: string): Promise<ActionResult> {
  await requireAuth();

  if (!isValidObjectId(quoteId)) return { ok: false, error: "Geçersiz teklif." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Not boş olamaz." };
  if (text.length > 5000) return { ok: false, error: "Not çok uzun." };

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    select: { id: true },
  });
  if (!quote) return { ok: false, error: "Teklif bulunamadı." };

  await prisma.note.create({ data: { quoteId, body: text } });

  revalidatePath(`/teklifler/${quoteId}`);
  return { ok: true };
}

/** KVKK: teklifi ve ilişkili veriyi KALICI siler (kvkk.ts util). */
export async function deleteQuoteAction(quoteId: string): Promise<void> {
  await requireAuth();
  // ObjectId guard (docs/13 §O1) — geçersiz id'de Prisma'ya gitme, sadece listeye dön.
  if (isValidObjectId(quoteId)) {
    await deleteQuoteRequest(quoteId);
    revalidatePath("/teklifler");
  }
  redirect("/teklifler");
}

/** KVKK: teklifi anonimleştirir (kişisel veri maskelenir, istatistik kalır). */
export async function anonymizeQuoteAction(quoteId: string): Promise<ActionResult> {
  await requireAuth();
  if (!isValidObjectId(quoteId)) return { ok: false, error: "Geçersiz teklif." };
  const result = await anonymizeQuoteRequest(quoteId);
  if (!result) return { ok: false, error: "Teklif bulunamadı." };
  revalidatePath(`/teklifler/${quoteId}`);
  revalidatePath("/teklifler");
  return { ok: true };
}

export interface PolicyDeliveryResult extends ActionResult {
  /** Müşteriye e-posta gönderildi mi? (e-posta yoksa / yapılandırma yoksa false) */
  emailSent?: boolean;
  /** Bilgilendirme notu (örn. "e-posta yapılandırılmadı"). */
  notice?: string;
}

const MAX_POLICY_MB = 15; // Poliçe belgesi azami boyut (MB). Boyut validateUpload'da uygulanır.

// Poliçe indirme linki geçerlilik süresi (docs/13 §Y1). 30 gün — müşterinin maile
// makul sürede erişimi için; süre dolunca yeni link talep eder.
const POLICY_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Blob içindeki poliçe belgesi yolu (kind="police"). */
function buildPolicyPath(quoteId: string, originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `police/${quoteId}/${unique}-${safe}`;
}

/**
 * Müşteriye gidecek İMZALI/SÜRELİ poliçe indirme linki (docs/13 §Y1). Ham blob URL
 * yerine web sitesindeki /police-indir rotasına token taşır. Site URL'i
 * NEXT_PUBLIC_SITE_URL (web). Token: signFileToken (HMAC, süreli).
 */
function buildPolicyDownloadUrl(assetId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dogukanozgan.com").replace(/\/+$/, "");
  const token = signFileToken({ assetId, expiresAt: Date.now() + POLICY_LINK_TTL_MS });
  return `${base}/police-indir?token=${encodeURIComponent(token)}`;
}

/**
 * Poliçe belgesini yükler → teklife bağlar → müşteri e-postası varsa "Poliçe Teslim"
 * maili gönderir (K28+K32, docs/12 madde 9).
 * - Storage yoksa hata döner (feature flag).
 * - E-posta yapılandırılmamışsa yükleme yapılır ama mail atlanır (bilgilendirme döner).
 */
export async function uploadAndSendPolicyAction(
  quoteId: string,
  formData: FormData,
): Promise<PolicyDeliveryResult> {
  await requireAuth();

  if (!isValidObjectId(quoteId)) return { ok: false, error: "Geçersiz teklif." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Belge seçilmedi." };
  }

  // DOSYA TÜRÜ DOĞRULAMASI (docs/13 §K2) — boyut + içerik imzası (magic-byte).
  // Poliçe belgesi: PDF veya görsel (JPG/PNG/WEBP). İstemcinin file.type'ına güvenilmez;
  // tür imzadan belirlenir, geçersizse REDDEDİLİR.
  const validation = await validateUpload(file, {
    allowed: ["pdf", "jpeg", "png", "webp"],
    maxSizeMb: MAX_POLICY_MB,
  });
  if (!validation.ok) {
    if (validation.reason === "too-large") {
      return { ok: false, error: `Belge çok büyük (en fazla ${MAX_POLICY_MB} MB).` };
    }
    return { ok: false, error: "Geçersiz dosya türü; yalnız PDF/JPG/PNG/WEBP yüklenebilir." };
  }

  if (!isStorageConfigured()) {
    return { ok: false, error: "Depolama yapılandırılmadı (BLOB_READ_WRITE_TOKEN eksik)." };
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    select: { id: true, email: true, product: true, locale: true },
  });
  if (!quote) return { ok: false, error: "Teklif bulunamadı." };

  // 1) Blob'a yükle. contentType = İMZA-DOĞRULANMIŞ MIME (docs/13 §K2), istemci beyanı değil.
  let uploaded: { url: string; path: string };
  try {
    uploaded = await uploadToStorage({
      path: buildPolicyPath(quoteId, file.name),
      body: await file.arrayBuffer(),
      contentType: validation.mime,
    });
  } catch (err) {
    logError("[teklif-detay] poliçe yükleme hatası:", err);
    return { ok: false, error: "Belge yüklenemedi." };
  }

  // 2) Teklife bağla (Asset kind="police" + policyAssetId).
  const attached = await attachPolicyDocument(quoteId, {
    url: uploaded.url,
    path: uploaded.path,
    // İmza-doğrulanmış MIME saklanır.
    mimeType: validation.mime,
    sizeBytes: file.size,
  });
  if (!attached) return { ok: false, error: "Belge teklife bağlanamadı." };

  revalidatePath(`/teklifler/${quoteId}`);

  // İmzalı/süreli indirme linki (docs/13 §Y1) — ham blob URL maile KONULMAZ.
  const policyUrl = buildPolicyDownloadUrl(attached.assetId);

  // 3) Müşteriye "Poliçe Teslim" maili (varsa). E-posta yoksa/yapılandırma yoksa atla.
  if (!quote.email) {
    return { ok: true, emailSent: false, notice: "Müşteri e-postası yok — mail gönderilmedi." };
  }
  if (!isEmailConfigured()) {
    return {
      ok: true,
      emailSent: false,
      notice: "E-posta yapılandırılmadı — belge yüklendi, mail gönderilmedi.",
    };
  }

  const sent = await sendPolicyDelivery({
    to: quote.email,
    productName: productLabel(quote.product),
    // İmzalı/süreli link (docs/13 §Y1) — ham public blob URL DEĞİL.
    policyUrl,
    locale: quote.locale,
  });

  if (!sent.ok) {
    return {
      ok: true,
      emailSent: false,
      notice: "Belge yüklendi ancak e-posta gönderilemedi.",
    };
  }

  return { ok: true, emailSent: true, notice: "Belge yüklendi ve müşteriye e-posta gönderildi." };
}
