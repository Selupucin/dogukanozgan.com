"use server";

// Genel admin Server Action'ları (oturum kapatma + bildirim çanı).
// GÜVENLİK: Bildirim action'ları oturum gerektirir (docs/05 "tüm admin server
// action'larında oturum kontrolü").

import { revalidatePath } from "next/cache";
import { markNotificationRead, markAllNotificationsRead, isValidObjectId } from "@do/db";
import { auth, signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Yetkisiz: oturum gerekli.");
  return session;
}

/** Tek bir bildirimi okundu işaretler (çana tıklayınca). */
export async function markNotificationReadAction(id: string): Promise<void> {
  await requireAuth();
  // ObjectId guard (docs/13 §O1) — geçersiz id'de Prisma'ya gitme.
  if (!isValidObjectId(id)) return;
  await markNotificationRead(id);
  revalidatePath("/", "layout");
}

/** Tüm okunmamış bildirimleri okundu işaretler. */
export async function markAllNotificationsReadAction(): Promise<void> {
  await requireAuth();
  await markAllNotificationsRead();
  revalidatePath("/", "layout");
}
