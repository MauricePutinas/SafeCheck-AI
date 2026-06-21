import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl font-semibold text-accent">404</p>
      <h1 className="mt-3 text-xl font-semibold">Nicht gefunden</h1>
      <p className="mt-2 text-slate-400">
        Diese Seite oder dieser Scan existiert nicht (mehr).
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-ghost">
          Zur Startseite
        </Link>
        <Link href="/scanner" className="btn-primary">
          Zum Scanner
        </Link>
      </div>
    </div>
  );
}
