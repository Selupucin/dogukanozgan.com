"use client";

// İki adımlı giriş formu (client). docs/05 + docs/09 form dili.
//   Adım 1 (credentials): e-posta + şifre + "Beni hatırla" + süre seçimi.
//   Adım 2 (otp): 6 haneli kod + "Kodu tekrar gönder" + "Vazgeç".
// state.step'e göre hangi action'a bağlanacağı belirlenir (startLogin / verifyLogin).
// Şifre tarayıcıda SAKLANMAZ — Adım 2'de yeniden istenmez; bekleyen-giriş sunucuda (çerez).

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { startLogin, verifyLogin, resendCode, cancelLogin } from "./actions";
import { INITIAL_LOGIN_STATE, type LoginState } from "./state";
import { DurationModal, durationLabel } from "./duration-modal";
import type { SessionDuration } from "@/lib/login-crypto";
import { buttonClass } from "@/components/ui";

const inputClass =
  "w-full rounded-xl border border-input bg-card px-4 py-2.5 text-foreground " +
  "placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 " +
  "focus:ring-ring focus:ring-offset-1 focus:ring-offset-background transition-shadow";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function LoginForm() {
  // Aktif adıma göre doğru action'a dağıt (dispatcher). useActionState tek state tutar.
  const [state, formAction] = useActionState<LoginState, FormData>(async (prev, formData) => {
    const intent = String(formData.get("intent") ?? "");
    if (prev.step === "otp") {
      if (intent === "resend") return resendCode(prev, formData);
      if (intent === "cancel") return cancelLogin();
      return verifyLogin(prev, formData);
    }
    return startLogin(prev, formData);
  }, INITIAL_LOGIN_STATE);

  // Adım 1 yerel durumu (hook sırası sabit kalsın diye erken dönüşten ÖNCE).
  const [showPassword, setShowPassword] = useState(false);
  // "Beni hatırla" + seçilen süre. remember=true İKEN duration dolu olur; checkbox
  // kaldırılınca null'a döner (startLogin remember=off → kısa oturum yapar, duration gönderilmez).
  const [remember, setRemember] = useState(false);
  const [duration, setDuration] = useState<SessionDuration | null>(null);
  // Modal açık mı? "intent" alanı: işaretlemeden mi açıldı (cancel'da checkbox işaretsiz kalsın)
  // yoksa "Değiştir"den mi (cancel'da mevcut seçim korunsun).
  const [modalIntent, setModalIntent] = useState<"check" | "change" | null>(null);

  function handleRememberChange(checked: boolean) {
    if (checked) {
      // İşaretlenince modalı aç; onay gelene kadar checkbox'ı henüz işaretli SAYMA.
      setModalIntent("check");
    } else {
      // İşaret kaldırıldı → süre sıfırlanır, gizli alan gönderilmez.
      setRemember(false);
      setDuration(null);
    }
  }

  function handleModalConfirm(value: SessionDuration) {
    setRemember(true);
    setDuration(value);
    setModalIntent(null);
  }

  function handleModalCancel() {
    // "check" iken vazgeçildi → seçim yapılmadı, checkbox işaretsiz kalsın.
    // "change" iken vazgeçildi → mevcut remember/duration korunur (dokunma).
    setModalIntent(null);
  }

  if (state.step === "otp") {
    return (
      <form action={formAction} className="flex w-full flex-col gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">
            Güvenliğiniz için e-posta adresinize bir doğrulama kodu gönderdik
            {state.maskedEmail ? (
              <>
                {" "}
                (<span className="font-medium text-foreground">{state.maskedEmail}</span>)
              </>
            ) : null}
            . Lütfen 6 haneli kodu girin.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Doğrulama kodu
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className={`${inputClass} text-center text-lg tracking-[0.4em]`}
            placeholder="______"
          />
        </div>

        {state.info && (
          <p role="status" className="text-sm text-muted-foreground">
            {state.info}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton label="Doğrula ve Giriş Yap" pendingLabel="Doğrulanıyor…" />

        <div className="flex items-center justify-between text-sm">
          {/* Aynı formdan farklı niyetlerle gönder (intent gizli alanı). */}
          <button
            type="submit"
            name="intent"
            value="resend"
            className="text-primary underline-offset-2 hover:underline"
          >
            Kodu tekrar gönder
          </button>
          <button
            type="submit"
            name="intent"
            value="cancel"
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  // Adım 1 — kimlik bilgileri.
  return (
    <form action={formAction} className="flex w-full flex-col gap-4 text-left">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          placeholder="ornek@dogukanozgan.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Şifre
        </label>
        {/* Input içine gömülü göz butonu (docs/09). Sağ padding ikon için yer açar. */}
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* "Beni hatırla" — işaretlenince süre modalı açılır (docs/05 §1). */}
      <div className="flex flex-col gap-2">
        <div className="flex min-h-[44px] items-center gap-2.5">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => handleRememberChange(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          />
          <label htmlFor="remember" className="text-sm">
            Bu cihazda beni hatırla
          </label>
        </div>

        {/* startLogin uyumu: remember "on" + duration yalnız onaylı seçimde gönderilir. */}
        {remember && duration && (
          <>
            <input type="hidden" name="remember" value="on" />
            <input type="hidden" name="duration" value={duration} />
            <p className="text-xs text-muted-foreground">
              Hatırlama süresi:{" "}
              <span className="font-medium text-foreground">{durationLabel(duration)}</span>
              {" · "}
              <button
                type="button"
                onClick={() => setModalIntent("change")}
                className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              >
                Değiştir
              </button>
            </p>
          </>
        )}
        {!remember && (
          <p className="text-xs text-muted-foreground">
            İşaretlenmezse oturum 12 saat sonra sona erer.
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton label="Giriş Yap" pendingLabel="Kontrol ediliyor…" />

      {modalIntent && (
        <DurationModal
          initialValue={duration ?? "1m"}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </form>
  );
}
