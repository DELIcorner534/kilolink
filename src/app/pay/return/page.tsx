import StripeReturnClient from "./return-client";

export const metadata = {
  title: "Retour vers l’app KiloLink",
};

type PageProps = {
  searchParams: Promise<{
    status?: string;
    bookingId?: string;
  }>;
};

export default async function StripeReturnPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status === "cancel" ? "cancel" : "success";
  const bookingId = sp.bookingId ?? "";
  const deepLink = bookingId
    ? `kilolink://booking/${bookingId}?payment=${status}`
    : `kilolink://?payment=${status}`;

  return <StripeReturnClient status={status} deepLink={deepLink} />;
}
