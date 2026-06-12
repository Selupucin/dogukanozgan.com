"use client";

// Sağlık Sigortası Prim Tahmini — İKİ SEKME (docs/03 §2):
//   Sekme 1 — "Tamamlayıcı (TSS)": ekonomik, SGK'lı; girdiler yaş + kapsam + kişi sayısı.
//     SGK aktif VARSAYILIR (ayrı checkbox yok) → küçük bilgi notu gösterilir.
//   Sekme 2 — "Özel (ÖSS)": geniş ağ/yüksek; yaş + kapsam + kişi sayısı + opsiyonel
//     "Yurt dışı teminatı" toggle (abroad). SGK şartı yoktur notu.
// Mantık: @do/products/calculators (saf fonksiyon + constants.ts katsayıları).
// docs/03: "Tahmini değerdir" uyarısı ZORUNLU. Sayılar YER TUTUCU'dur.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { calculateSaglik, SAGLIK } from "@do/products/calculators";
import type { Locale } from "@/components/auto-form/types-bridge";
import {
  CalculatorShell,
  InputRow,
  ModeTabs,
  ResultStat,
  EstimateNotice,
  NumberField,
  formatRangeTRY,
} from "./ui";

type SaglikType = "tss" | "oss";

export function SaglikCalculator({
  locale,
  onUseValues,
}: {
  locale: Locale;
  /** Forma aktarılacak değerler (definitions.ts alan adlarıyla eşleşir). */
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [type, setType] = useState<SaglikType>("tss");

  return (
    <CalculatorShell titleKey="saglik.title" introKey="saglik.intro">
      <ModeTabs<SaglikType>
        ariaLabel={t("saglik.typeLabel")}
        value={type}
        onChange={setType}
        options={[
          { value: "tss", label: t("saglik.tabTss") },
          { value: "oss", label: t("saglik.tabOss") },
        ]}
      />

      {type === "tss" ? (
        <SaglikPanel locale={locale} type="tss" onUseValues={onUseValues} />
      ) : (
        <SaglikPanel locale={locale} type="oss" onUseValues={onUseValues} />
      )}
    </CalculatorShell>
  );
}

// Tek panel iki türü de yönetir; tür-özel notlar/alanlar koşulludur.
// ModeTabs zaten role=tablist/tab; panel role=tabpanel ile tamamlanır (erişilebilirlik).
function SaglikPanel({
  locale,
  type,
  onUseValues,
}: {
  locale: Locale;
  type: SaglikType;
  onUseValues?: (values: Record<string, unknown>) => void;
}) {
  const t = useTranslations("calculator");
  const [age, setAge] = useState<number>(SAGLIK.defaultAge);
  const [coverage, setCoverage] = useState<"bireysel" | "aile">("bireysel");
  const [people, setPeople] = useState<number>(3);
  const [abroad, setAbroad] = useState(false);

  const result = useMemo(
    () =>
      calculateSaglik({
        age,
        type,
        coverage,
        peopleCount: people,
        abroad: type === "oss" ? abroad : false,
      }),
    [age, type, coverage, people, abroad],
  );

  return (
    <div role="tabpanel" aria-label={type === "tss" ? t("saglik.tabTss") : t("saglik.tabOss")}>
      {/* Tür notu: TSS → SGK gerekli; ÖSS → SGK şartı yok. */}
      <p
        role="note"
        className="mb-5 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-accent-foreground/90"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>{type === "tss" ? t("saglik.tssNote") : t("saglik.ossNote")}</span>
      </p>

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
                  name={`saglik-coverage-${type}`}
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

        {/* ÖSS — opsiyonel yurt dışı teminatı toggle (TSS'de YOK). */}
        {type === "oss" && (
          <label className="flex min-h-[44px] items-center gap-3 self-end py-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={abroad}
              onChange={(e) => setAbroad(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded-md border-input text-primary focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-foreground">{t("saglik.abroad")}</span>
          </label>
        )}
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
            onUseValues({
              kapsam: coverage,
              kisiSayisi: coverage === "aile" ? people : undefined,
            })
          }
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill bg-destructive px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[hsl(9_84%_38%)] sm:w-auto"
        >
          {t("useInForm")}
        </button>
      )}
    </div>
  );
}
