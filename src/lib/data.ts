export const supportedCountries = [
  { name: "Belgique", code: "be" },
  { name: "Benin", code: "bj" },
  { name: "Cameroun", code: "cm" },
  { name: "Togo", code: "tg" },
] as const;

export const availableCorridors = [
  { from: "Belgique", to: "Benin" },
  { from: "Benin", to: "Belgique" },
  { from: "Belgique", to: "Cameroun" },
  { from: "Cameroun", to: "Belgique" },
  { from: "Belgique", to: "Togo" },
  { from: "Togo", to: "Belgique" },
] as const;
