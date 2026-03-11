import Image from 'next/image';
import Link from 'next/link';

const SERVICES = [
  'Business Registration',
  'Tax Filing & Compliance',
  'Bookkeeping Services',
  'Financial Consulting',
  'Business Advisory',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/agila_logo.webp"
              alt="Agila Tax Management Services"
              width={36}
              height={36}
              className="rounded-sm"
            />
            <span className="font-bold text-slate-800 text-base leading-tight">
              Agila Tax Management<br />
              <span className="text-xs font-normal text-slate-500 tracking-wide">Services</span>
            </span>
          </Link>

          <Link
            href="/sign-in"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/agila_logo.webp"
                alt="ATMS Logo"
                width={32}
                height={32}
                className="rounded-sm"
              />
              <span className="text-white font-bold text-sm">Agila Tax Management Services</span>
            </div>
            <p className="text-sm leading-relaxed">
              We offer innovative solutions in business registration, bookkeeping, and tax
              filing, removing the stress of compliance so entrepreneurs can focus on growing
              their businesses.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Our Services</h4>
            <ul className="space-y-2 text-sm">
              {SERVICES.map((label) => (
                <li key={label} className="hover:text-white transition">{label}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact Information</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 Lahug, Cebu City, Philippines</li>
              <li>
                <a href="mailto:info@agilacebu.com" className="hover:text-white transition">
                  ✉️ info@agilacebu.com
                </a>
              </li>
              <li>
                <a href="tel:+639622485706" className="hover:text-white transition">
                  📞 +63 962-248-5706
                </a>
              </li>
            </ul>
            <a
              href="https://www.facebook.com/profile.php?id=61565479076573"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm hover:text-white transition"
            >
              Facebook →
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          © 2025 Copyright: Agila Tax Management Services | All Rights Reserved
        </div>
      </footer>

    </div>
  );
}
