"use client";

// İki adımlı giriş formu (client). docs/05 + docs/09 form dili.
//   Adım 1 (credentials): e-posta + şifre + "Beni hatırla" + süre seçimi.
//   Adım 2 (otp): 6 haneli kod + "Kodu tekrar gönder" + "Vazgeç".
// state.step'e göre hangi action'a bağlanacağı belirlenir (startLogin / verifyLogin).
// Şifre tarayıcıda SAKLANMAZ — Adım 2'de yeniden istenmez; bekleyen-giriş sunucuda (çerez).

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startLogin, verifyLogin, resendCode, cancelLogin } from "./actions";
import { INITIAL_LOGIN_STATE, type LoginState } from "./state";
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
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id="remember"
          name="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="remember" className="text-sm">
          Bu cihazda beni hatırla
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="duration" className="text-sm font-medium">
          Oturum süresi
        </label>
        <select id="duration" name="duration" defaultValue="1m" className={inputClass}>
          <option value="1m">1 ay</option>
          <option value="6m">6 ay</option>
          <option value="1y">1 yıl</option>
          <option value="forever">Her zaman</option>
        </select>
        <p className="text-xs text-muted-foreground">
          “Beni hatırla” işaretliyse oturum bu süre kadar açık kalır; aksi halde 12 saat sonra sona
          erer.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton label="Giriş Yap" pendingLabel="Kontrol ediliyor…" />
    </form>
  );
}
