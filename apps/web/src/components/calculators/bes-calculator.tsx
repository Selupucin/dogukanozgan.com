"use client";

// BES Birikim Hesaplayıcı — etkileşimli (girdi → anlık sonuç).
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: devlet katkısı (%30) dahil; "Tahmini değerdir" uyarısı ZORUNLU.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateBes, BES } from "@do/products/calculators";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatTRY,
} from "./ui";

export function BesCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [monthly, setMonthly] = useState<number>(BES.defaultMonthly);
  const [years, setYears] = useState<number>(BES.defaultYears);
  const [returnPct, setReturnPct] = useState<number>(Math.round(BES.defaultAnnualReturnRate * 100));

  const result = useMemo(
    () =>
      calculateBes({
        monthlyContribution: monthly,
        years,
        annualReturnRate: returnPct / 100,
      }),
    [monthly, years, returnPct],
  );

  return (
    <CalculatorShell titleKey="bes.title" introKey="bes.intro">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResultStat
          label={t("bes.resultContributions")}
          value={formatTRY(result.totalContributions, locale)}
        />
        <ResultStat
          label={t("bes.resultState")}
          value={formatTRY(result.stateContribution, locale)}
          accent="teal"
        />
        <ResultStat
          label={t("bes.resultTotal")}
          value={formatTRY(result.estimatedTotal, locale)}
          accent="orange"
        />
      </div>

      <EstimateNotice />

      {onUseValues && (
        <button
          type="button"
          onClick={() => onUseValues({ aylikTutar: monthly })}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive sm:w-auto"
        >
          {t("useInForm")}
        </button>
      )}
    </CalculatorShell>
  );
}
