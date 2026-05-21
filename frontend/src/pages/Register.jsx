import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthFormLayout from '../components/auth/AuthFormLayout';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    birth_date: '',
    shipping_address: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  // Pomocnicze: data 18 lat temu (max dla pola date) - blokuje wybór młodszych
  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  // Próba ekstrakcji sensownego błędu z odpowiedzi DRF (różne kształty)
  const extractError = (data) => {
    if (!data) return 'Nieznany błąd serwera.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    // Lista pól z błędami: { username: ['...'], email: ['...'] }
    const messages = [];
    for (const [field, val] of Object.entries(data)) {
      const items = Array.isArray(val) ? val : [val];
      items.forEach(item => {
        if (typeof item === 'string') messages.push(`${field}: ${item}`);
      });
    }
    return messages.length ? messages.join('\n') : 'Nieznany błąd.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    // Walidacja po stronie klienta — szybki feedback bez round-tripa
    if (form.password !== form.password_confirm) {
      setError('Hasła nie są takie same.');
      return;
    }
    if (form.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.');
      return;
    }
    if (!form.birth_date) {
      setError('Data urodzenia jest wymagana.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Rejestracja
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        birth_date: form.birth_date,
      };
      if (form.shipping_address.trim()) {
        payload.shipping_address = form.shipping_address.trim();
      }
      // Świadomie NIE wysyłamy 'role' - backend nada default 'buyer'.
      // Streamera nadaje admin w panelu Django, nie user sam sobie.

      const regRes = await fetch('http://localhost:8000/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setError(extractError(regData));
        return;
      }

      setMessage('Konto utworzone. Loguję cię automatycznie...');

      // 2. Auto-login - korzystamy z tych samych credentials.
      // Login używa email + password (USERNAME_FIELD = 'email' w modelu).
      const loginRes = await fetch('http://localhost:8000/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        localStorage.setItem('access_token', loginData.access);
        localStorage.setItem('refresh_token', loginData.refresh);
        navigate('/');
      } else {
        // Konto powstało ale auto-login się nie udał - kieruj na /login
        setMessage('Konto utworzone. Zaloguj się ręcznie.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title="Rejestracja"
      subtitle="Utwórz konto kupującego. Aby zostać streamerem skontaktuj się z administracją."
      footerText="Masz już konto?"
      footerHref="/login"
      footerLink="Zaloguj się"
    >
      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Nazwa użytkownika</span>
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
          <span className="text-sm font-bold text-gray-300">Data urodzenia (musisz mieć 18+)</span>
          <input
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            required
            max={maxBirthDate}
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">
            Adres dostawy <span className="text-gray-500 font-normal">(opcjonalnie)</span>
          </span>
          <textarea
            name="shipping_address"
            value={form.shipping_address}
            onChange={handleChange}
            rows={2}
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400 resize-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Hasło (min. 8 znaków)</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Potwierdź hasło</span>
          <input
            name="password_confirm"
            type="password"
            value={form.password_confirm}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full rounded-lg px-5 py-4 text-sm font-black uppercase text-gray-950 transition ${
            isSubmitting
              ? 'bg-amber-400/50 cursor-not-allowed'
              : 'bg-amber-400 hover:bg-amber-300'
          }`}
        >
          {isSubmitting ? 'Tworzę konto...' : 'Utwórz konto'}
        </button>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300 whitespace-pre-line">
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
