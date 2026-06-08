"use server";

// İletişim talebi Server Action'ları — durum değiştir, sil.
// Kaynak: docs/12 §4 (İletişim Talepleri, K31), docs/05 (erişim güvenliği).
//
// GÜVENLİK: Her action başında oturum kontrolü (docs/05).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, isValidObjectId, type ContactStatus } from "@do/db";
import { auth } from "@/auth";
import { canContactTransition, CONTACT_STATUSES } from "@/lib/contact-crm";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz: oturum gerekli.");
  return session;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** İletişim talebi durumunu değiştirir (docs/12 K31 akışına göre geçiş doğrulanır). */
export async function updateContactStatusAction(id: string, next: string): Promise<ActionResult> {
  await requireAuth();

  // ObjectId guard (docs/13 §O1).
  if (!isValidObjectId(id)) return { ok: false, error: "Geçersiz talep." };

  if (!CONTACT_STATUSES.includes(next as ContactStatus)) {
    return { ok: false, error: "Geçersiz durum." };
  }
  const target = next as ContactStatus;

  const contact = await prisma.contactRequest.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!contact) return { ok: false, error: "Talep bulunamadı." };

  if (!canContactTransition(contact.status, target)) {
    return { ok: false, error: "Bu duruma geçiş yapılamaz." };
  }

  await prisma.contactRequest.update({
    where: { id },
    data: { status: target },
  });

  revalidatePath(`/iletisim-talepleri/${id}`);
  revalidatePath("/iletisim-talepleri");
  return { ok: true };
}

/** KVKK: iletişim talebini KALICI siler. */
export async function deleteContactAction(id: string): Promise<void> {
  await requireAuth();
  // ObjectId guard (docs/13 §O1) — geçersiz id'de Prisma'ya gitme, sadece listeye dön.
  if (isValidObjectId(id)) {
    await prisma.contactRequest.delete({ where: { id } });
    revalidatePath("/iletisim-talepleri");
  }
  redirect("/iletisim-talepleri");
}
