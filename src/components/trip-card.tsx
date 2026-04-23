import Link from "next/link";
import type { Trip } from "@/lib/types";

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(2,8,23,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(2,8,23,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0b1f4d] to-[#1d3f8f] font-semibold text-white">
            {trip.travelerAvatar}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{trip.travelerName}</p>
            <p className="text-sm text-slate-500">Note {trip.rating}/5</p>
          </div>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {trip.kilosAvailable} kg dispo
        </p>
      </div>
      <p className="text-sm font-medium text-slate-700">
        {trip.origin} → {trip.destination}
      </p>
      <p className="mt-1 text-sm text-slate-500">Depart: {trip.departureDate}</p>
      <p className="mt-1 text-sm text-slate-500">Compagnie: {trip.airline}</p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xl font-bold tracking-tight text-[#0b1f4d]">{trip.pricePerKg} EUR/kg</p>
        <Link
          href={`/booking/new?tripId=${encodeURIComponent(trip.id)}`}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition group-hover:bg-[#0b1f4d]"
        >
          Reserver
        </Link>
      </div>
    </article>
  );
}
