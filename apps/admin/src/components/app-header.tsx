// Admin üst çubuğu — marka, gezinme, bildirim çanı, oturum kapatma.
// Korumalı sayfalarda gösterilir; login'de gösterilmez.
// Bildirimler (K29) burada server'da çekilir; DB yoksa zarifçe boş gösterilir.

import Link from "next/link";
import { listNotifications, unreadNotificationCount, logError } from "@do/db";
import { signOutAction } from "@/app/actions";
import { buttonClass } from "@/components/ui";
import { NotificationBell, type BellNotification } from "@/components/notification-bell";

const NAV = [
  { href: "/teklifler", label: "Teklifler" },
  { href: "/iletisim-talepleri", label: "İletişim" },
  { href: "/policeler", label: "Poliçeler" },
];

export async function AppHeader({ email }: { email?: string | null }) {
  let notifications: BellNotification[] = [];
  let unread = 0;
  try {
    [notifications, unread] = await Promise.all([
      listNotifications({ limit: 15 }),
      unreadNotificationCount(),
    ]);
  } catch (err) {
    // DB yoksa çan boş kalır; sayfa çökmeyle uğraşmaz (Aşama 7 DB bağlanınca dolacak).
    logError("[app-header] bildirim çekme hatası:", err);
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/teklifler" className="flex flex-col">
            <span className="font-heading text-lg font-semibold leading-tight">Doğukan Özgan</span>
            <span className="text-xs text-muted-foreground">Yönetim Paneli</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications} unreadCount={unread} />
          {email && <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>}
          <form action={signOutAction}>
            <button type="submit" className={buttonClass("outline", "sm")}>
              Çıkış
            </button>
          </form>
        </div>
      </div>
      {/* Mobil gezinme */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
