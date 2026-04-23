import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/search", label: "Recherche" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

async function signOutAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/");
  }
  await supabase.auth.signOut();
  redirect("/");
}

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    // No user info available without Supabase
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-[#0b1f4d]">
            Kilo<span className="text-slate-900">Link</span>
          </Link>
          <nav className="hidden items-center rounded-full border border-slate-200 bg-slate-50/70 px-2 py-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-[#0b1f4d]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="text-sm font-semibold text-slate-700">
              Connexion
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#0b1f4d] px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-blue-900/20 transition hover:brightness-110"
            >
              Espace membre
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>
    );
  }
  const user = (await supabase.auth.getUser()).data.user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-[#0b1f4d]">
          Kilo<span className="text-slate-900">Link</span>
        </Link>
        <nav className="hidden items-center rounded-full border border-slate-200 bg-slate-50/70 px-2 py-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-[#0b1f4d]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!user ? (
            <Link href="/auth/sign-in" className="text-sm font-semibold text-slate-700">
              Connexion
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="rounded-full bg-[#0b1f4d] px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-blue-900/20 transition hover:brightness-110"
          >
            Espace membre
          </Link>
          {user ? (
            <form action={signOutAction}>
              <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Deconnexion
              </button>
            </form>
          ) : null}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
