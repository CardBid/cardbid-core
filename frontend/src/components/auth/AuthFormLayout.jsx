import { Link } from 'react-router-dom';

export default function AuthFormLayout({ title, subtitle, children, footerText, footerHref, footerLink }) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-6">
      <div className="flex flex-col justify-center">
        <p className="text-sm font-black uppercase text-emerald-300">CardBid account</p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-gray-400">{subtitle}</p>
      </div>

      <div className="flex items-center">
        <div className="w-full rounded-lg border border-white/10 bg-gray-900 p-5 md:p-8">
          {children}
          <p className="mt-6 text-center text-sm text-gray-500">
            {footerText}{' '}
            <Link to={footerHref} className="font-bold text-emerald-300 hover:text-emerald-200">
              {footerLink}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
