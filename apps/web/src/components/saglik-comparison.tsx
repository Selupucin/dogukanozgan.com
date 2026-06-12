// Sağlık ürün sayfasına özel: Tamamlayıcı (TSS) ile Özel (ÖSS) sağlık sigortası
// AÇIKLAMA + KARŞILAŞTIRMA + KISA KARAR REHBERİ bölümü (docs/03 §2).
// Yalnızca slug === "saglik" tanım sayfasında render edilir ([slug]/page.tsx).
//
// İçerik i18n "saglikCompare" namespace'inden gelir (TR/EN parite). Sunucu bileşeni
// (getTranslations). Tasarım docs/09: iki kart + erişilebilir karşılaştırma tablosu
// (<table> + <th scope>), eyebrow + Fraunces başlık, teal/turuncu aksanlar, dark+light.

import { getTranslations } from "next-intl/server";
import { CheckCircle2, ShieldCheck, Stethoscope, Info, ArrowRight } from "lucide-react";

type Row = { criterion: string; tss: string; oss: string };

export async function SaglikComparison() {
  const t = await getTranslations("saglikCompare");
  // Diziler t.raw ile alınır (mesaj dosyasındaki yapılandırılmış içerik).
  const rows = t.raw("rows") as Row[];
  const guide = t.raw("guide") as string[];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.1em] eyebrow">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("intro")}</p>
        </div>

        {/* İki tanıtım kartı: TSS (teal) ve ÖSS (turuncu). */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-[var(--radius)] border border-secondary/30 bg-card p-6 shadow-sm sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-xl text-foreground">{t("tssTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("tssBody")}</p>
            <p className="mt-4 rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-accent-foreground/90">
              {t("tssFor")}
            </p>
          </article>

          <article className="rounded-[var(--radius)] border border-primary/30 bg-card p-6 shadow-sm sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Stethoscope className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-xl text-foreground">{t("ossTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("ossBody")}</p>
            <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-accent-foreground/90">
              {t("ossFor")}
            </p>
          </article>
        </div>

        {/* Karşılaştırma tablosu — erişilebilir <table> (başlık <th scope>). */}
        <div className="mt-12">
          <h3 className="font-heading text-xl text-foreground">{t("tableTitle")}</h3>
          <div className="mt-5 overflow-x-auto rounded-[var(--radius)] border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">{t("title")}</caption>
              <thead>
                <tr className="bg-muted/60">
                  <th scope="col" className="px-4 py-3 font-heading font-semibold text-foreground">
                    {t("colCriterion")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold text-secondary">
                    {t("colTss")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-heading font-semibold text-primary">
                    {t("colOss")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.criterion} className={i % 2 === 1 ? "bg-muted/30" : "bg-card"}>
                    <th
                      scope="row"
                      className="border-t border-border px-4 py-3 font-medium text-foreground"
                    >
                      {row.criterion}
                    </th>
                    <td className="border-t border-border px-4 py-3 text-muted-foreground">
                      {row.tss}
                    </td>
                    <td className="border-t border-border px-4 py-3 text-muted-foreground">
                      {row.oss}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kısa karar rehberi + doğruluk notları. */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-border bg-card p-6">
            <h3 className="font-heading text-lg text-foreground">{t("guideTitle")}</h3>
            <ul className="mt-4 space-y-3">
              {guide.map((g) => (
                <li key={g} className="flex items-start gap-3 text-sm text-foreground">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius)] border border-border bg-muted/40 p-6">
            <h3 className="flex items-center gap-2 font-heading text-lg text-foreground">
              <Info className="h-5 w-5 text-secondary" aria-hidden />
              {t("noteTitle")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                <span>{t("note1")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                <span>{t("note2")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
