"use server";

// Manuel poliçe/müşteri ekleme Server Action (K32 / docs/12 §4).
// Web dışı müşteriler için: createManualQuote (source=MANUAL).
// GÜVENLİK: oturum kontrolü (docs/05).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createManualQuote, logError } from "@do/db";
import { getProduct } from "@do/products";
import { auth } from "@/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz: oturum gerekli.");
  return session;
}

export interface ManualQuoteResult {
  ok: boolean;
  error?: string;
  /** Oluşturulan teklif id'si (başarıda yönlendirme için). */
  id?: string;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createManualQuoteAction(formData: FormData): Promise<ManualQuoteResult> {
  await requireAuth();

  const product = str(formData.get("product"));
  const fullName = str(formData.get("fullName"));
  const phone = str(formData.get("phone"));
  const email = str(formData.get("email"));
  const start = parseDate(formData.get("policyStartDate"));
  const end = parseDate(formData.get("policyEndDate"));

  if (!product || !getProduct(product)) {
    return { ok: false, error: "Geçerli bir ürün seçin." };
  }
  if (!fullName) return { ok: false, error: "Ad soyad zorunludur." };
  if (!phone) return { ok: false, error: "Telefon zorunludur." };

  // Poliçe tarihi girildiyse ikisi de olmalı + tutarlı olmalı.
  if ((start && !end) || (!start && end)) {
    return { ok: false, error: "Poliçe için hem başlangıç hem bitiş tarihi girin." };
  }
  if (start && end && end <= start) {
    return { ok: false, error: "Bitiş tarihi başlangıçtan sonra olmalıdır." };
  }

  // Tarih girildiyse poliçe yapılmış kabul edilir; aksi halde YENI (takipte).
  const status = start && end ? "POLICE_YAPILDI" : "YENI";

  let id: string;
  try {
    const quote = await createManualQuote({
      product,
      fullName,
      phone,
      email: email || null,
      policyStartDate: start,
      policyEndDate: end,
      status,
    });
    id = quote.id;
  } catch (err) {
    logError("[teklifler/yeni] manuel kayıt hatası:", err);
    return { ok: false, error: "Kayıt oluşturulamadı (DB bağlantısı?)." };
  }

  revalidatePath("/teklifler");
  revalidatePath("/policeler");
  redirect(`/teklifler/${id}`);
}
