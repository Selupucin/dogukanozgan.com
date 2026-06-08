"use client";

// BES Birikim Hesaplayıcı — etkileşimli (girdi → anlık sonuç).
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: devlet katkısı (%30) dahil; "Tahmini değerdir" uyarısı ZORUNLU.
//
// İki mod (docs/03): "Aylık Katkı" ve "Toplu Yatırım" (asgari 1.000.000 TL).
// Sonuçta ayrıca REEL (enflasyondan arındırılmış bugünkü) değer satırı gösterilir.
// ⚠️ Tüm sayısal varsayımlar (getiri %50, üst %120, enflasyon %32,5, toplu min 1.000.000)
// site sahibinin ÖRNEK varsayımlarıdır; gerçek mevzuat/aktüeryal değer değildir
// (constants.BES içindeki // TODO(doc) notlarına bkz.).

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateBes, BES } from "@do/products/calculators";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ModeTabs,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatTRY,
} from "./ui";

type BesMode = "aylik" | "toplu";

export function BesCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [mode, setMode] = useState<BesMode>("aylik");
  const [monthly, setMonthly] = useState<number>(BES.defaultMonthly);
  const [lumpSum, setLumpSum] = useState<number>(BES.defaultLumpSum);
  const [years, setYears] = useState<number>(BES.defaultYears);
  const [returnPct, setReturnPct] = useState<number>(Math.round(BES.defaultAnnualReturnRate * 100));
  const [inflationPct, setInflationPct] = useState<number>(
    Math.round(BES.defaultInflationRate * 100),
  );

  const result = useMemo(
    () =>
      calculateBes({
        monthlyContribution: mode === "aylik" ? monthly : 0,
        lumpSum: mode === "toplu" ? lumpSum : 0,
        years,
        annualReturnRate: returnPct / 100,
        inflationRate: inflationPct / 100,
      }),
    [mode, monthly, lumpSum, years, returnPct, inflationPct],
  );

  return (
    <CalculatorShell titleKey="bes.title" introKey="bes.intro">
      <ModeTabs<BesMode>
        ariaLabel={t("bes.modeLabel")}
        value={mode}
        onChange={setMode}
        options={[
          { value: "aylik", label: t("bes.modeMonthly") },
          { value: "toplu", label: t("bes.modeLump") },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {mode === "aylik" ? (
          <InputRow id="bes-monthly" label={t("bes.monthly")}>
            <NumberField
              id="bes-monthly"
              thousands
              min={BES.minMonthly}
              max={BES.maxMonthly}
              value={monthly}
              fallback={BES.defaultMonthly}
              onChange={setMonthly}
              clearLabel={t("clear")}
            />
          </InputRow>
        ) : (
          <InputRow id="bes-lump" label={t("bes.lumpSum")}>
            <NumberField
              id="bes-lump"
              thousands
              min={BES.minLumpSum}
              max={BES.maxLumpSum}
              step={100000}
              value={lumpSum}
              fallback={BES.defaultLumpSum}
              onChange={setLumpSum}
              clearLabel={t("clear")}
            />
          </InputRow>
        )}
        <InputRow id="bes-years" label={t("bes.years")}>
          <NumberField
            id="bes-years"
            min={BES.minYears}
            max={BES.maxYears}
            value={years}
            fallback={BES.defaultYears}
            onChange={setYears}
            clearLabel={t("clear")}
          />
        </InputRow>
        <InputRow id="bes-return" label={t("bes.returnRate")}>
          <NumberField
            id="bes-return"
            decimal
            min={Math.round(BES.minAnnualReturnRate * 100)}
            max={Math.round(BES.maxAnnualReturnRate * 100)}
            value={returnPct}
            fallback={Math.round(BES.defaultAnnualReturnRate * 100)}
            onChange={setReturnPct}
            clearLabel={t("clear")}
          />
        </InputRow>
      </div>

      <div className="mt-4">
        <InputRow id="bes-inflation" label={t("bes.inflationRate")}>
          <NumberField
            id="bes-inflation"
            decimal
            min={Math.round(BES.minInflationRate * 100)}
            max={Math.round(BES.maxInflationRate * 100)}
            value={inflationPct}
            fallback={Math.round(BES.defaultInflationRate * 100)}
            onChange={setInflationPct}
            clearLabel={t("clear")}
          />
        </InputRow>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResultStat
          label={t("bes.resultContributions")}
          value={formatTRY(result.totalContributions, locale)}
        />
        {mode === "aylik" && (
          <ResultStat
            label={t("bes.resultState")}
            value={formatTRY(result.stateContribution, locale)}
            accent="teal"
          />
        )}
        <ResultStat
          label={t("bes.resultTotal")}
          value={formatTRY(result.estimatedTotal, locale)}
          accent="orange"
        />
      </div>

      <div className="mt-3 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3">
        <div className="text-xs text-muted-foreground">{t("bes.resultReal")}</div>
        <div className="mt-1 font-heading text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
          ≈ {formatTRY(result.realValue, locale)}
        </div>
        <p className="mt-1 text-xs text-accent-foreground/80">
          {t("bes.realHint", { years, inflation: inflationPct })}
        </p>
      </div>

      <EstimateNotice />

      {onUseValues && (
        <button
          type="button"
          onClick={() => onUseValues({ aylikTutar: mode === "aylik" ? monthly : undefined })}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive sm:w-auto"
        >
          {t("useInForm")}
        </button>
      )}
    </CalculatorShell>
  );
}
