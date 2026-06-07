"use client";

// Zincirleme (cascade) adres alanı — İl / İlçe / Mahalle (docs/03).
// - province: 81 il (pakette gömülü, @do/products/locations).
// - district: seçilen ilin ilçeleri (pakette gömülü; üst il değişince sıfırlanır).
// - neighborhood: seçilen ilçenin mahalleleri — /api/locations'tan TALEBE GÖRE fetch
//   (büyük veri istemci paketine girmesin). Üst ilçe değişince sıfırlanır.
//
// Stil docs/09: yuvarlak, teal focus ring, ≥44px dokunma hedefi; light + dark uyumlu.
// Erişilebilir: gerçek <select> kullanır (klavye + mobil native picker).

import { useEffect, useMemo, useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { cn } from "@do/ui";
import { getProvinces, getDistricts } from "@do/products/locations";
import type { ProductField, Locale } from "./types-bridge";

const selectClass = cn(
  "w-full min-h-[44px] rounded-xl border border-input bg-card px-4 py-2.5 text-base text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
  "transition-shadow disabled:cursor-not-allowed disabled:opacity-60",
);

interface CascadeFieldProps {
  field: ProductField;
  locale: Locale;
  form: UseFormReturn<Record<string, unknown>>;
  id: string;
  describedBy?: string;
}

export function CascadeField({ field, locale, form, id, describedBy }: CascadeFieldProps) {
  if (field.type === "province") {
    return (
      <ProvinceSelect field={field} locale={locale} form={form} id={id} describedBy={describedBy} />
    );
  }
  if (field.type === "district") {
    return (
      <DistrictSelect field={field} locale={locale} form={form} id={id} describedBy={describedBy} />
    );
  }
  // neighborhood
  return (
    <NeighborhoodSelect
      field={field}
      locale={locale}
      form={form}
      id={id}
      describedBy={describedBy}
    />
  );
}

const placeholderText = (locale: Locale) => (locale === "tr" ? "Seçiniz" : "Select");
const loadingText = (locale: Locale) => (locale === "tr" ? "Yükleniyor…" : "Loading…");

function ProvinceSelect({ field, locale, form, id, describedBy }: CascadeFieldProps) {
  const provinces = useMemo(() => getProvinces(), []);
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: rhf }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          value={(rhf.value as string) ?? ""}
          onChange={(e) => rhf.onChange(e.target.value)}
          onBlur={rhf.onBlur}
          className={selectClass}
        >
          <option value="">{placeholderText(locale)}</option>
          {provinces.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    />
  );
}

function DistrictSelect({ field, locale, form, id, describedBy }: CascadeFieldProps) {
  const parentName = field.cascade?.parent ?? "il";
  const provinceId = form.watch(parentName) as string | undefined;
  const districts = useMemo(() => (provinceId ? getDistricts(provinceId) : []), [provinceId]);

  // Üst il değişince ilçe seçimini sıfırla (geçersiz kalmasın).
  useEffect(() => {
    const current = form.getValues(field.name) as string | undefined;
    if (current && !districts.some((d) => String(d.id) === current)) {
      form.setValue(field.name, "", { shouldValidate: false });
    }
    // provinceId değişimine bağlı sıfırlama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId]);

  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: rhf }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          disabled={!provinceId}
          value={(rhf.value as string) ?? ""}
          onChange={(e) => rhf.onChange(e.target.value)}
          onBlur={rhf.onBlur}
          className={selectClass}
        >
          <option value="">
            {provinceId
              ? placeholderText(locale)
              : locale === "tr"
                ? "Önce il seçin"
                : "Select a province first"}
          </option>
          {districts.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.name}
            </option>
          ))}
        </select>
      )}
    />
  );
}

function NeighborhoodSelect({ field, locale, form, id, describedBy }: CascadeFieldProps) {
  const parentName = field.cascade?.parent ?? "ilce";
  const districtId = form.watch(parentName) as string | undefined;
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // İlçe değişince mahalleleri /api/locations'tan getir; seçimi sıfırla.
  useEffect(() => {
    let active = true;
    const current = form.getValues(field.name) as string | undefined;
    if (current) form.setValue(field.name, "", { shouldValidate: false });

    if (!districtId) {
      setNames([]);
      return;
    }
    setLoading(true);
    fetch(`/api/locations?type=neighborhoods&districtId=${encodeURIComponent(districtId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { name: string }[]) => {
        if (!active) return;
        setNames(Array.isArray(data) ? data.map((n) => n.name) : []);
      })
      .catch(() => active && setNames([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: rhf }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          disabled={!districtId || loading}
          value={(rhf.value as string) ?? ""}
          onChange={(e) => rhf.onChange(e.target.value)}
          onBlur={rhf.onBlur}
          className={selectClass}
        >
          <option value="">
            {!districtId
              ? locale === "tr"
                ? "Önce ilçe seçin"
                : "Select a district first"
              : loading
                ? loadingText(locale)
                : placeholderText(locale)}
          </option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
    />
  );
}
