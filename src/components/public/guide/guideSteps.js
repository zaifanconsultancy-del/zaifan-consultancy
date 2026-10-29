// A country guide is one journey in six steps; each section is one step.
export const GUIDE_STEPS = [
  { id: "fit", label: "Is it for me?" },
  { id: "budget", label: "Money" },
  { id: "universities", label: "Universities" },
  { id: "scholarships", label: "Scholarships" },
  { id: "cities", label: "Cities" },
  { id: "apply", label: "Apply & visa" },
];

export function money(symbol, value) {
  return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

export function moneyRange(symbol, low, high) {
  return Math.round(low) === Math.round(high) ? money(symbol, low) : `${money(symbol, low)} – ${money(symbol, high)}`;
}
