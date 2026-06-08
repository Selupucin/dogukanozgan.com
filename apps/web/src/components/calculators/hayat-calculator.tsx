"use client";

// Hayat Sigortası Hesaplayıcı — İKİ MOD (docs/03):
//   Mod 1 — "Vefat Teminatı (Koruma)": MEVCUT yaklaşık prim tahmini (calculateHayat).
//     ⚠️ Sayılar/katsayılar DEĞİŞTİRİLMEDİ; site sahibi gerçek Allianz/Fiba demo
//     ekranlarıyla kalibre edecek (BEKLEMEDE). "Yaklaşık" uyarısı belirgin.
//   Mod 2 — "Birikim & Vergi Avantajı": birikimli hayat anlatısı + tahmini vergi
//     avantajı (calculateHayatVergi, YER TUTUCU GVK kuralları) + altın/döviz koruması
//     bilgi kartı (sayısal projeksiyon YOK).
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: "Tahmini değerdir" uyarısı ZORUNLU; para alanlarında binlik ayırıcı maske.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateHayat, calculateHayatVergi, HAYAT, HAYAT_VERGI } from "@do/products/calculators";
import { Coins, Info } from "lucide-react";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ModeTabs,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatTRY,
  formatRangeTRY,
} from "./ui";

type HayatMode = "vefat" | "birikim";

export function HayatCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [mode, setMode] = useState<HayatMode>("vefat");

  return (
    <CalculatorShell titleKey="hayat.title" introKey="hayat.intro">
      <ModeTabs<HayatMode>
        ariaLabel={t("hayat.modeLabel")}
        value={mode}
        onChange={setMode}
        options={[
          { value: "vefat", label: t("hayat.modeVefat") },
          { value: "birikim", label: t("hayat.modeBirikim") },
        ]}
      />

      {mode === "vefat" ? (
        <VefatMode locale={locale} onUseValues={onUseValues} />
      ) : (
        <BirikimMode locale={locale} />
      )}
    </CalculatorShell>
  );
}

// ── Mod 1: Vefat Teminatı (Koruma) — MEVCUT hesaplama, kalibrasyon beklemede ───────
function VefatMode({
  locale,
  onUseValues,
}: {
  locale: Locale;
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [age, setAge] = useState<number>(HAYAT.defaultAge);
  const [coverage, setCoverage] = useState<number>(HAYAT.defaultCoverage);
  const [years, setYears] = useState<number>(HAYAT.defaultYears);
  const [smoker, setSmoker] = useState(false);

  const result = useMemo(
    () => calculateHayat({ age, coverageAmount: coverage, years, smoker }),
    [age, coverage, years, smoker],
  );

  return (
    <>
      <p className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-accent-foreground/90">
        {t("hayat.vefatLead")}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputRow id="hayat-age" label={t("hayat.age")}>
          <NumberField
            id="hayat-age"
            min={HAYAT.minAge}
            max={HAYAT.maxAge}
            value={age}
            fallback={HAYAT.defaultAge}
            onChange={setAge}
            clearLabel={t("clear")}
          />
        </InputRow>
        <InputRow id="hayat-coverage" label={t("hayat.coverage")}>
          <NumberField
            id="hayat-coverage"
            thousands
            min={HAYAT.minCoverage}
            max={HAYAT.maxCoverage}
            step={50000}
            value={coverage}
            fallback={HAYAT.defaultCoverage}
            onChange={setCoverage}
            clearLabel={t("clear")}
          />
        </InputRow>
        <InputRow id="hayat-years" label={t("hayat.years")}>
          <NumberField
            id="hayat-years"
            min={HAYAT.minYears}
            max={HAYAT.maxYears}
            value={years}
            fallback={HAYAT.defaultYears}
            onChange={setYears}
            clearLabel={t("clear")}
          />
        </InputRow>
      </div>

      <label className="mt-4 flex min-h-[44px] items-center gap-3 py-1">
        <input
          type="checkbox"
          checked={smoker}
          onChange={(e) => setSmoker(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded-md border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-foreground">{t("hayat.smoker")}</span>
      </label>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultStat
          label={t("hayat.resultMonthly")}
          value={formatRangeTRY(result.monthlyMin, result.monthlyMax, locale)}
          accent="orange"
        />
        <ResultStat
          label={t("hayat.resultAnnual")}
          value={formatRangeTRY(result.annualMin, result.annualMax, locale)}
          accent="teal"
        />
      </div>

      <EstimateNotice />

      {onUseValues && (
        <button
          type="button"
          onClick={() => onUseValues({ teminatTutari: coverage, sure: years, sigara: smoker })}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive sm:w-auto"
        >
          {t("useInForm")}
        </button>
      )}
    </>
  );
}

// ── Mod 2: Birikim & Vergi Avantajı (YENİ) — vergi avantajı + altın/döviz kartı ────
function BirikimMode({ locale }: { locale: Locale }) {
  const t = useTranslations("calculator");
  const [annualPremium, setAnnualPremium] = useState<number>(HAYAT_VERGI.defaultAnnualPremium);
  const [taxRatePct, setTaxRatePct] = useState<number>(
    Math.round(HAYAT_VERGI.defaultTaxBracketRate * 100),
  );
  const [years, setYears] = useState<number>(HAYAT_VERGI.defaultYears);

  const result = useMemo(
    () => calculateHayatVergi({ annualPremium, taxBracketRate: taxRatePct / 100, years }),
    [annualPremium, taxRatePct, years],
  );

  return (
    <>
      <p className="mb-5 text-sm text-accent-foreground/90">{t("hayat.birikimLead")}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputRow id="hayat-premium" label={t("hayat.annualPremium")}>
          <NumberField
            id="hayat-premium"
            thousands
            min={HAYAT_VERGI.minAnnualPremium}
            max={HAYAT_VERGI.maxAnnualPremium}
            step={10000}
            value={annualPremium}
            fallback={HAYAT_VERGI.defaultAnnualPremium}
            onChange={setAnnualPremium}
            clearLabel={t("clear")}
          />
        </InputRow>

        <InputRow id="hayat-bracket" label={t("hayat.taxBracket")}>
          <select
            id="hayat-bracket"
            value={taxRatePct}
            onChange={(e) => setTaxRatePct(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-input bg-card px-4 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {HAYAT_VERGI.taxBracketRates.map((r) => (
              <option key={r} value={Math.round(r * 100)}>
                %{Math.round(r * 100)}
              </option>
            ))}
          </select>
        </InputRow>

        <InputRow id="hayat-vergi-years" label={t("hayat.termYears")}>
          <NumberField
            id="hayat-vergi-years"
            min={HAYAT_VERGI.minYears}
            max={HAYAT_VERGI.maxYears}
            value={years}
            fallback={HAYAT_VERGI.defaultYears}
            onChange={setYears}
            clearLabel={t("clear")}
          />
        </InputRow>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultStat
          label={t("hayat.resultAnnualAdvantage")}
          value={formatTRY(result.annualAdvantage, locale)}
          accent="teal"
        />
        <ResultStat
          label={t("hayat.resultTotalAdvantage")}
          value={formatTRY(result.totalAdvantage, locale)}
          accent="orange"
        />
      </div>

      {/* Altın/Döviz koruması — kalitatif bilgi kartı (sayısal projeksiyon YOK). */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          <Coins className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <div className="font-heading text-base text-foreground">{t("hayat.goldTitle")}</div>
          <p className="mt-1 text-sm text-accent-foreground/85">{t("hayat.goldBody")}</p>
        </div>
      </div>

      <p
        role="note"
        className="mt-4 flex items-start gap-2 rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-xs text-accent-foreground/90"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
        <span>
          <strong className="font-semibold text-foreground">{t("estimateNoticeStrong")}</strong>{" "}
          {t("hayat.vergiNotice")}
        </span>
      </p>
    </>
  );
}
