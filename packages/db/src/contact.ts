// @do/db — İletişim talepleri (K31 / docs/12). YALNIZCA SUNUCU.
//
// Web iletişim formu artık (WhatsApp yerine/yanında) buraya kaydeder. Kayıt
// oluşturulurken admin için bir ILETISIM bildirimi de üretilir (K29).
// KVKK (docs/06): rıza kanıtı (consentAt/Ip/UserAgent) tutulur.

import { prisma, type ContactRequest } from "./index";
import { createNotification } from "./notifications";
import { logError } from "./log-error";

export interface CreateContactRequestInput {
  fullName: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  /** KVKK rıza verildi mi (zorunlu — false ise çağıran reddetmeli). */
  consentKvkk: boolean;
  /** Rıza kanıtı: istemci IP'si (server action'dan iletilir). */
  consentIp?: string | null;
  /** Rıza kanıtı: user-agent. */
  consentUserAgent?: string | null;
}

/**
 * Bir iletişim talebi oluşturur ve admin'e ILETISIM bildirimi üretir.
 * Bildirim üretimi başarısız olsa bile talep KAYBOLMAZ (hata yutulur + loglanır).
 */
export async function createContactRequest(
  input: CreateContactRequestInput,
): Promise<ContactRequest> {
  const contact = await prisma.contactRequest.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      subject: input.subject ?? null,
      message: input.message,
      consentKvkk: input.consentKvkk,
      // Rıza VERİLDİ ise kanıt zamanı kaydedilir (docs/06 §2).
      consentAt: input.consentKvkk ? new Date() : null,
      consentIp: input.consentIp ?? null,
      consentUserAgent: input.consentUserAgent ?? null,
    },
  });

  // Admin bildirimi — talebi düşürmesin diye hata yutulur (K29 panel-içi çan).
  try {
    const title = input.subject?.trim()
      ? `Yeni iletişim talebi: ${input.subject.trim()}`
      : "Yeni iletişim talebi";
    await createNotification({
      type: "ILETISIM",
      title,
      body: `${input.fullName} — ${input.phone}`,
      relatedId: contact.id,
    });
  } catch (err) {
    logError("[contact] notification create failed, continuing:", err);
  }

  return contact;
}
