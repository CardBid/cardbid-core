import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/live', label: 'Live Room' },
  { to: '/login', label: 'Logowanie' },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <NavLink to="/marketplace" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-sm font-black text-gray-950">
              CB
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-black">CardBid</span>
              <span className="block text-xs font-bold uppercase text-gray-500">Core UI</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? 'bg-white text-gray-950'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/register"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-gray-950 transition hover:bg-amber-300"
          >
            Zaloz konto
          </NavLink>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
