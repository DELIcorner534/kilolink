export type CountryCode = "BE" | "BJ" | "TG" | "CM";

export type Trip = {
  id: string;
  travelerName: string;
  travelerAvatar: string;
  /** Average from profile when the traveler has at least one review; otherwise null. */
  rating: number | null;
  origin: string;
  destination: string;
  departureDate: string;
  kilosAvailable: number;
  pricePerKg: number;
  airline: string;
};

export type Review = {
  id: string;
  author: string;
  comment: string;
  rating: number;
};

export type FaqItem = {
  question: string;
  answer: string;
};
