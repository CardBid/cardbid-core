import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthFormLayout from '../components/auth/AuthFormLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('Logging in...');

    try {
      const response = await fetch('https://cardbid.up.railway.app/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid login credentials. Check your email and password.');
      }

      const data = await response.json();

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      setMessage('Logged in. Redirecting...');
      navigate('/');
    } catch (err) {
      setError(err.message);
      setMessage(null);
    }
  };

  return (
    <AuthFormLayout title="Log in" subtitle="Log in to access the auctions">
      <form className="space-y-5" onSubmit={handleLogin}>
        <label className="block">
          <span className="text-sm font-bold text-gray-300">Email</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-300">Password</span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-white/10 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase text-gray-950 transition hover:bg-emerald-300"
        >
          Log in
        </button>

        {message && <p className="mt-4 font-bold text-emerald-400">{message}</p>}
        {error && <p className="mt-4 font-bold text-red-500">{error}</p>}
      </form>
    </AuthFormLayout>
  );
}