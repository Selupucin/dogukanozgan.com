"use client";

// Kategorili SSS akordeonu (docs/02 "ürün bazında da gösterilebilir", docs/09 madde 7).
// /sss sayfası kullanır: her kategori (Genel + ürünler) bir kart başlığı altında,
// içindeki sorular erişilebilir açılır-kapanır listeler.
//
// Erişilebilirlik: her soru bir <button> + aria-expanded; içerik panel'i role="region"
// olarak ilişkilendirilir (klavye ile gezilebilir). Açık durum kategori bazında izlenir.

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@do/ui";
import { faqCategories, type FaqCategory } from "@/lib/faq";
import type { Locale } from "@/i18n/routing";

function CategoryBlock({
  category,
  locale,
  /** İlk kategorinin ilk sorusu varsayılan açık olsun diye. */
  defaultFirstOpen = false,
}: {
  category: FaqCategory;
  locale: Locale;
  defaultFirstOpen?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(defaultFirstOpen ? 0 : null);
  const baseId = useId();

  return (
    <section aria-labelledby={`${baseId}-title`} className="scroll-mt-24" id={category.id}>
      <h2
        id={`${baseId}-title`}
        className="flex items-center gap-3 font-heading text-xl font-semibold text-foreground sm:text-2xl"
      >
        {/* docs/09 teal aksan */}
        <span aria-hidden className="h-6 w-1.5 rounded-full bg-secondary" />
        {category.title[locale]}
      </h2>

      <div className="mt-4 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        {category.items.map((item, i) => {
          const isOpen = open === i;
          const btnId = `${baseId}-q-${i}`;
          const panelId = `${baseId}-a-${i}`;
          return (
            <div key={i}>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-semibold text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
                >
                  <span>{item.q[locale]}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-secondary transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                hidden={!isOpen}
                className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6"
              >
                {item.a[locale]}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FaqCategories({
  locale,
  categories = faqCategories,
}: {
  locale: Locale;
  categories?: FaqCategory[];
}) {
  return (
    <div className="space-y-10">
      {categories.map((category, idx) => (
        <CategoryBlock
          key={category.id}
          category={category}
          locale={locale}
          defaultFirstOpen={idx === 0}
        />
      ))}
    </div>
  );
}
