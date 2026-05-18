import { useState } from 'react';
import AuthFormLayout from '../components/auth/AuthFormLayout';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('Mock logowania zapisany po stronie UI. Backend auth mozna podpiac w tym handlerze.');
  };

  return (
    <AuthFormLayout
      title="Logowanie"
      subtitle="Wejdz do konta, zeby korzystac z portfela, historii zakupow i szybkiego zakupu Buy Now."
      footerText="Nie masz konta?"
      footerHref="/register"
      footerLink="Zarejestruj sie"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Haslo</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300"
        >
          Zaloguj
        </button>

        {message && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
            {message}
          </p>
        )}
      </form>
    </AuthFormLayout>
  );
}
