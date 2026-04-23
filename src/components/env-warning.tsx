type EnvWarningProps = {
  title?: string;
};

export function EnvWarning({ title = "Configuration requise" }: EnvWarningProps) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">
        Configurez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`,
        puis redemarrez `npm run dev`.
      </p>
    </div>
  );
}
