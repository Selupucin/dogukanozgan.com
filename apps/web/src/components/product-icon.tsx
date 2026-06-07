// Ürün ikonu — definitions.ts'teki `icon` string anahtarını lucide ikonuna eşler.
// Bilinmeyen anahtar için güvenli varsayılan (Shield) kullanılır.
import {
  Car,
  CarFront,
  HeartPulse,
  HeartHandshake,
  PiggyBank,
  Home,
  Building2,
  Plane,
  Shield,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Car,
  CarFront,
  HeartPulse,
  HeartHandshake,
  PiggyBank,
  Home,
  Building2,
  Plane,
  Shield,
};

export function ProductIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Shield;
  return <Icon className={className} aria-hidden />;
}
