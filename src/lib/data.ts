import type { FaqItem, Review, Trip } from "@/lib/types";

export const supportedCountries = [
  { name: "Belgique", code: "be" },
  { name: "Benin", code: "bj" },
  { name: "Cameroun", code: "cm" },
  { name: "Togo", code: "tg" },
] as const;

export const trips: Trip[] = [
  {
    id: "TRIP-001",
    travelerName: "Aline",
    travelerAvatar: "A",
    rating: 4.9,
    origin: "Bruxelles",
    destination: "Cotonou",
    departureDate: "2026-05-03",
    kilosAvailable: 18,
    pricePerKg: 14,
    airline: "Brussels Airlines",
  },
  {
    id: "TRIP-002",
    travelerName: "Samuel",
    travelerAvatar: "S",
    rating: 4.7,
    origin: "Anvers",
    destination: "Lome",
    departureDate: "2026-05-11",
    kilosAvailable: 12,
    pricePerKg: 12,
    airline: "Air France",
  },
  {
    id: "TRIP-003",
    travelerName: "Nadine",
    travelerAvatar: "N",
    rating: 5,
    origin: "Bruxelles",
    destination: "Douala",
    departureDate: "2026-05-14",
    kilosAvailable: 20,
    pricePerKg: 16,
    airline: "Turkish Airlines",
  },
];

export const reviews: Review[] = [
  {
    id: "REV-001",
    author: "Kossi",
    comment: "Service rapide, communication claire, colis recu en parfait etat.",
    rating: 5,
  },
  {
    id: "REV-002",
    author: "Mireille",
    comment: "Interface premium et reservation tres simple.",
    rating: 5,
  },
  {
    id: "REV-003",
    author: "Boris",
    comment: "Je recommande. Processus fiable entre Bruxelles et Cotonou.",
    rating: 4,
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Comment fonctionne la reservation des kilos ?",
    answer:
      "Choisissez un trajet, indiquez le poids de votre colis et validez la demande. Le voyageur confirme ensuite la reservation.",
  },
  {
    question: "Comment sont securises les paiements ?",
    answer:
      "Les paiements passent par Stripe avec suivi de transaction et gestion de commission plateforme.",
  },
  {
    question: "Quels objets sont interdits ?",
    answer:
      "Tout objet illicite, dangereux ou non conforme aux regles aeriennes est refuse automatiquement.",
  },
];

export const availableCorridors = [
  { from: "Belgique", to: "Benin" },
  { from: "Benin", to: "Belgique" },
  { from: "Belgique", to: "Cameroun" },
  { from: "Cameroun", to: "Belgique" },
  { from: "Belgique", to: "Togo" },
  { from: "Togo", to: "Belgique" },
] as const;
