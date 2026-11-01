import { countryIndex as countryList } from "../../../data/countries/countryIndex";

export const WHATSAPP_NUMBER = "923305718131";
export const PHONE_DISPLAY = "0330 5718131";
export const PHONE_HREF = "tel:+923305718131";
export const EMAIL = "zaifanconsultancy@gmail.com";
export const OFFICE = "Peshawar, Pakistan";

export function whatsappLink(text = "Hello Zaifan Consultancy, I'd like help planning my studies abroad.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const NOT_SURE = "Not sure yet";
export const EU = "European Union";

// Destination choices for both forms: the nine countries, the EU, or undecided.
export const DESTINATIONS = [...countryList.map((country) => country.name), EU, NOT_SURE];

// Three-letter codes shown on passes, stamps and departure boards.
const CODES = {
  italy: "ITA",
  germany: "DEU",
  france: "FRA",
  belgium: "BEL",
  romania: "ROU",
  lithuania: "LTU",
  turkey: "TUR",
  china: "CHN",
  vietnam: "VNM",
};

export function destinationCode(name) {
  const country = countryList.find((item) => item.name === name);
  if (country) return CODES[country.slug];
  return name === EU ? "EU" : "ANY";
}

export function findDestination(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DESTINATIONS.find((option) => option.toLowerCase() === normalized) || "";
}
