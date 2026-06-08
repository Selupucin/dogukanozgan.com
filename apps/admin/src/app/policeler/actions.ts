"use server";

// Poliçe takvimi Server Action'ları — yaklaşan bitişleri bildir (K32 / docs/12 §4).
// GÜVENLİK: oturum kontrolü (docs/05).

import { revalidatePath } from "next/cache";
import { notifyExpiringPolicies, logError } from "@do/db";
import { auth } from "@/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz: oturum gerekli.");
  return session;
}

export interface NotifyResult {
  ok: boolean;
  created?: number;
  error?: string;
}

/**
 * Önümüzdeki `days` gün içinde bitecek poliçeler için POLICE_BITIS bildirimi üretir.
 * Aynı poliçe için okunmamış bildirim varsa atlanır (@do/db içinde tekilleştirilir).
 */
export async function notifyExpiringAction(days = 30): Promise<NotifyResult> {
  await requireAuth();
  try {
    const created = await notifyExpiringPolicies(days);
    revalidatePath("/policeler");
    revalidatePath("/", "layout");
    return { ok: true, created };
  } catch (err) {
    logError("[policeler] bildirim üretimi hatası:", err);
    return { ok: false, error: "Bildirim üretilemedi." };
  }
}
