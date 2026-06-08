"use client";

// Hayat Sigortası Prim Tahmini — etkileşimli (girdi → anlık aralık).
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: yaş / teminat / süre / sigara → kaba prim; "Tahmini" uyarısı ZORUNLU.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateHayat, HAYAT } from "@do/products/calculators";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatRangeTRY,
} from "./ui";

export function HayatCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
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
    <CalculatorShell titleKey="hayat.title" introKey="hayat.intro">
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
    </CalculatorShell>
  );
}
