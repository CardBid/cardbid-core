import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthFormLayout from '../components/auth/AuthFormLayout';

export default function Register() {
  const [countries, setCountries] = useState([]);
  
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    birth_date: '',
    shipping_address: '',
    country_id: '',
    state_id: '',
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      const cached = localStorage.getItem('countries_list');
      if (cached) {
        setCountries(JSON.parse(cached));
        return;
      }

      try {
        const res = await fetch('https://cardbid.up.railway.app/api/countries/');
        const data = await res.json();
        
        const list = Array.isArray(data) ? data : (data?.results || []);
        
        localStorage.setItem('countries_list', JSON.stringify(list));
        setCountries(list);
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    
    fetchCountries();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCountryChange = (event) => {
    setForm((current) => ({
      ...current,
      country_id: event.target.value,
      state_id: '',
    }));
  };

  const selectedCountryObj = countries.find(c => String(c.id) === String(form.country_id));
  const showStates = selectedCountryObj?.has_states;
  const availableStates = selectedCountryObj?.states || [];

  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  const extractError = (data) => {
    if (!data) return 'Unknown server error.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    const messages = [];
    for (const [field, val] of Object.entries(data)) {
      const items = Array.isArray(val) ? val : [val];
      items.forEach(item => {
        if (typeof item === 'string') messages.push(`${field}: ${item}`);
      });
    }
    return messages.length ? messages.join('\n') : 'Unknown error.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    // Walidacja frontendowa
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!form.birth_date) {
      setError('Birth date is required.');
      return;
    }
    if (!form.country_id) {
      setError('Country selection is required.');
      return;
    }
    if (showStates && !form.state_id) {
      setError('For the selected country, choosing a state/region is mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        birth_date: form.birth_date,
        country: parseInt(form.country_id),
      };
      
      if (showStates && form.state_id) {
        payload.state = parseInt(form.state_id);
      }
      if (form.shipping_address.trim()) {
        payload.shipping_address = form.shipping_address.trim();
      }

      const regRes = await fetch('https://cardbid.up.railway.app/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setError(extractError(regData));
        return;
      }

      setMessage('Account created...');

      const loginRes = await fetch('https://cardbid.up.railway.app/api/auth/login/', {
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
        setMessage('Account created. Please log in manually.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title="Register"
      subtitle="Create a buyer account. To become a streamer, contact administration."
      footerText="Already have an account?"
      footerHref="/login"
      footerLink="Log in"
    >
      <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Username</span>
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
          <span className="text-sm font-bold text-gray-300">Birth Date (you must be 18+)</span>
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
          <span className="text-sm font-bold text-gray-300">Country</span>
          <select
            name="country_id"
            value={form.country_id}
            onChange={handleCountryChange}
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          >
            <option value="">-- Select Country --</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        {showStates && (
          <label className="block">
            <span className="text-sm font-bold text-gray-300">State / Province</span>
            <select
              name="state_id"
              value={form.state_id}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              <option value="">-- Select Region --</option>
              {availableStates.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-sm font-bold text-gray-300">
            Shipping Address <span className="text-gray-500 font-normal">(optional)</span>
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
          <span className="text-sm font-bold text-gray-300">Password (min. 8 characters)</span>
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
          <span className="text-sm font-bold text-gray-300">Confirm Password</span>
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
          {isSubmitting ? 'Creating account...' : 'Create Account'}
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