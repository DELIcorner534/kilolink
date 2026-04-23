export type CountryCode = "BE" | "BJ" | "TG" | "CM";

export type Trip = {
  id: string;
  travelerName: string;
  travelerAvatar: string;
  rating: number;
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
