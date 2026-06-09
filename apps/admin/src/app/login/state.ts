// Giriş formu UI state tipi + başlangıç değeri.
// ⚠️ Bu dosya "use server" DEĞİLDİR: `actions.ts` ("use server") yalnız async fonksiyon
// export edebilir; bir NESNE (INITIAL_LOGIN_STATE) export edilemez (Next.js kuralı —
// "A use server file can only export async functions"). Bu yüzden state burada tutulur;
// hem actions.ts (tip) hem login-form.tsx (tip + başlangıç değeri) buradan import eder.

/** UI state — `step` hangi adımın gösterileceğini söyler. */
export interface LoginState {
  step: "credentials" | "otp";
  error?: string;
  /** Adım 2'de bilgilendirme (kod gönderildi / yeniden gönderildi). */
  info?: string;
  /** Adım 2'de gösterilecek maskeli e-posta (kullanıcıya hangi adrese gittiğini hatırlatır). */
  maskedEmail?: string;
}

export const INITIAL_LOGIN_STATE: LoginState = { step: "credentials" };
