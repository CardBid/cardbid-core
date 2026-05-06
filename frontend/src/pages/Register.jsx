import { useState } from 'react';
import AuthFormLayout from '../components/auth/AuthFormLayout';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    role: 'buyer',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Hasla nie sa takie same.');
      setMessage('');
      return;
    }

    setError('');
    setMessage(`Mock rejestracji gotowy dla roli: ${form.role}.`);
  };

  return (
    <AuthFormLayout
      title="Rejestracja"
      subtitle="Utworz konto widza lub streamera. Formularz jest przygotowany pod role z modelu Django."
      footerText="Masz juz konto?"
      footerHref="/login"
      footerLink="Zaloguj sie"
    >
      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Nazwa uzytkownika</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Rola</span>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          >
            <option value="buyer">Uzytkownik</option>
            <option value="streamer">Streamer</option>
          </select>
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
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Potwierdz haslo</span>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-amber-400 px-5 py-4 text-sm font-black uppercase text-gray-950 transition hover:bg-amber-300"
        >
          Utworz konto
        </button>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
            {message}
          </p>
        )}
      </form>
    </AuthFormLayout>
  );
}
