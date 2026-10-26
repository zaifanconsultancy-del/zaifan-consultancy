import {
  Award,
  BriefcaseBusiness,
  Building2,
  Cpu,
  Globe2,
  GraduationCap,
  Handshake,
  Heart,
  House,
  Landmark,
  Languages,
  Plane,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

// Country data files reference icons by key so they stay plain data.
const ICONS = {
  award: Award,
  briefcase: BriefcaseBusiness,
  building: Building2,
  cpu: Cpu,
  globe: Globe2,
  graduation: GraduationCap,
  handshake: Handshake,
  heart: Heart,
  home: House,
  landmark: Landmark,
  languages: Languages,
  plane: Plane,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  sun: Sun,
  trendingUp: TrendingUp,
  trophy: Trophy,
  wallet: Wallet,
};

export function iconFor(key) {
  return ICONS[key] || Sparkles;
}
