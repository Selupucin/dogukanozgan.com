"use client";

// Sağlık Sigortası Prim Tahmini — etkileşimli (girdi → anlık aralık).
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: yaş / SGK (TSS/Özel) / kapsam → kaba aylık aralık; "Tahmini" uyarısı ZORUNLU.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateSaglik, SAGLIK } from "@do/products/calculators";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatRangeTRY,
} from "./ui";

export function SaglikCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [age, setAge] = useState<number>(SAGLIK.defaultAge);
  const [hasSgk, setHasSgk] = useState(false);
  const [coverage, setCoverage] = useState<"bireysel" | "aile">("bireysel");
  const [people, setPeople] = useState<number>(3);

  const result = useMemo(
    () => calculateSaglik({ age, hasSgk, coverage, peopleCount: people }),
    [age, hasSgk, coverage, people],
  );

  return (
    <CalculatorShell titleKey="saglik.title" introKey="saglik.intro">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputRow id="saglik-age" label={t("saglik.age")}>
          <NumberField
            id="saglik-age"
            min={SAGLIK.minAge}
            max={SAGLIK.maxAge}
            value={age}
            fallback={SAGLIK.defaultAge}
            onChange={setAge}
            clearLabel={t("clear")}
          />
        </InputRow>

        <InputRow id="saglik-coverage" label={t("saglik.coverage")}>
          <div role="radiogroup" className="flex flex-wrap gap-3 pt-1">
            {(["bireysel", "aile"] as const).map((c) => (
              <label
                key={c}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-pill border border-input bg-card px-4 py-2 text-sm has-[:checked]:border-secondary has-[:checked]:bg-accent sm:flex-none sm:justify-start"
              >
                <input
                  type="radio"
                  name="saglik-coverage"
                  value={c}
                  checked={coverage === c}
                  onChange={() => setCoverage(c)}
                  className="h-4 w-4 text-secondary focus:ring-2 focus:ring-ring"
                />
                {c === "bireysel" ? t("saglik.coverageIndividual") : t("saglik.coverageFamily")}
              </label>
            ))}
          </div>
        </InputRow>

        {coverage === "aile" && (
          <InputRow id="saglik-people" label={t("saglik.people")}>
            <NumberField
              id="saglik-people"
              min={2}
              max={SAGLIK.maxPeople}
              value={people}
              fallback={3}
              onChange={setPeople}
              clearLabel={t("clear")}
            />
          </InputRow>
        )}

        <label className="flex min-h-[44px] items-center gap-3 self-end py-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={hasSgk}
            onChange={(e) => setHasSgk(e.target.checked)}
            className="h-5 w-5 shrink-0 rounded-md border-input text-primary focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-foreground">{t("saglik.sgk")}</span>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultStat
          label={t("saglik.resultMonthly")}
          value={formatRangeTRY(result.monthlyMin, result.monthlyMax, locale)}
          accent="orange"
        />
        <ResultStat
          label={t("saglik.resultAnnual")}
          value={formatRangeTRY(result.annualMin, result.annualMax, locale)}
          accent="teal"
        />
      </div>

      <EstimateNotice />

      {onUseValues && (
        <button
          type="button"
          onClick={() =>
            onUseValues({ kapsam: coverage, kisiSayisi: coverage === "aile" ? people : undefined })
          }
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive sm:w-auto"
        >
          {t("useInForm")}
        </button>
      )}
    </CalculatorShell>
  );
}
