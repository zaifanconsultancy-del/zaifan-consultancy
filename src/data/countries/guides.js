import { getCountryBySlug } from "./countryRegistry";
import { italyGuide } from "./deep/italyGuide";
import { ITALY_CONTEXT } from "../universities/italyContext";
import { allUniversities } from "../universities";

import italyPhoto from "../../assets/images/country-explorer/italy.webp";
import germanyPhoto from "../../assets/images/country-explorer/germany.webp";
import francePhoto from "../../assets/images/country-explorer/france.webp";
import belgiumPhoto from "../../assets/images/country-explorer/belgium.webp";
import romaniaPhoto from "../../assets/images/country-explorer/romania.webp";
import lithuaniaPhoto from "../../assets/images/country-explorer/lithuania.webp";
import turkeyPhoto from "../../assets/images/country-explorer/turkey.webp";
import chinaPhoto from "../../assets/images/country-explorer/china.webp";
import vietnamPhoto from "../../assets/images/country-explorer/vietnam.webp";

// One landmark photo per destination for the guide's hero postcard. Italy,
// Germany and Turkey are the site's own; the rest come from Wikimedia Commons
// and keep their credit and licence.
const LANDMARKS = {
  italy: { src: italyPhoto, place: "Rome", caption: "The Colosseum, Rome" },
  germany: { src: germanyPhoto, place: "Berlin", caption: "Brandenburg Gate, Berlin" },
  france: {
    src: francePhoto,
    place: "Paris",
    caption: "The Eiffel Tower, Paris",
    credit: "Yann Caradec",
    license: "CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques,_Paris_ao%C3%BBt_2014_(2).jpg",
  },
  belgium: {
    src: belgiumPhoto,
    place: "Brussels",
    caption: "Grand-Place, Brussels",
    credit: "Francisco Conde Sánchez",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Grand_Place_Bruselas_2.jpg",
  },
  romania: {
    src: romaniaPhoto,
    place: "Bucharest",
    caption: "Romanian Athenaeum, Bucharest",
    credit: "Diego Delso",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Ateneo_Rumano,_Bucarest,_Ruman%C3%ADa,_2016-05-29,_DD_73.jpg",
  },
  lithuania: {
    src: lithuaniaPhoto,
    place: "Vilnius",
    caption: "Vilnius Old Town",
    credit: "BigHead",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Vilnius_old_town_by_Augustas_Didzgalvis.jpg",
  },
  turkey: { src: turkeyPhoto, place: "Istanbul", caption: "Istanbul from the water" },
  china: {
    src: chinaPhoto,
    place: "Shanghai",
    caption: "The Bund, Shanghai",
    credit: "钉钉",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:The_Bund_2.jpg",
  },
  vietnam: {
    src: vietnamPhoto,
    place: "Hanoi",
    caption: "Temple of Literature, Hanoi",
    credit: "Chuoibk",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Hanoi_Temple_of_Literature_(cropped).jpg",
  },
};

// The city whose local time the hero shows, and its IANA time zone.
const CLOCKS = {
  italy: { city: "Rome", zone: "Europe/Rome" },
  germany: { city: "Berlin", zone: "Europe/Berlin" },
  france: { city: "Paris", zone: "Europe/Paris" },
  belgium: { city: "Brussels", zone: "Europe/Brussels" },
  romania: { city: "Bucharest", zone: "Europe/Bucharest" },
  lithuania: { city: "Vilnius", zone: "Europe/Vilnius" },
  turkey: { city: "Istanbul", zone: "Europe/Istanbul" },
  china: { city: "Beijing", zone: "Asia/Shanghai" },
  vietnam: { city: "Hanoi", zone: "Asia/Ho_Chi_Minh" },
};

function italyCountry(base) {
  return {
    ...base,
    ...ITALY_CONTEXT,
    ...italyGuide,
    quickFacts: { ...base.quickFacts, ...ITALY_CONTEXT.quickFacts },
    visa: { ...ITALY_CONTEXT.visa, ...italyGuide.visa },
  };
}

/** Everything one destination guide page needs, in the same shape for all nine countries. */
export function getDestinationGuide(slug) {
  const base = getCountryBySlug(slug);
  if (!base) return null;
  const country = base.slug === "italy" ? italyCountry(base) : base;

  return {
    ...country,
    photo: LANDMARKS[country.slug] || null,
    clock: CLOCKS[country.slug] || null,
    // The shared university list carries photos, facts and profile paths.
    universities: allUniversities.filter((university) => university.countrySlug === country.slug),
  };
}
