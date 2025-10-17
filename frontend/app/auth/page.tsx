'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'Player' | 'Dungeon Master'>('Player');
  const [loginRole, setLoginRole] = useState<'Player' | 'Dungeon Master' | null>(null);

  async function submit() {
    setMessage(null);
    setIsLoading(true);
    
    try {
      const body = mode === 'signup' 
        ? { username, password, role }
        : { username, password };
      
        
      const res = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setMessage({ type: 'error', text: 'Username already exists. Try logging in instead.' });
        } else if (res.status === 401) {
          setMessage({ type: 'error', text: 'Invalid username or password.' });
        } else {
          setMessage({ type: 'error', text: data.error ? JSON.stringify(data.error) : 'Request failed' });
        }
        return;
      }
      
      setToken(data.token);
      // Store token and role in sessionStorage for tab isolation
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('userRole', data.role);
      
      // Store success message for display on the appropriate page
      const successMessage = mode === 'signup' 
        ? `Account created successfully as ${data.role}! You are now logged in.` 
        : `Login successful as ${data.role}! Welcome back.`;
      sessionStorage.setItem('authSuccessMessage', successMessage);
      
      // Redirect based on role
      if (data.role === 'Dungeon Master') {
        window.location.replace('/dm-console');
      } else {
        window.location.replace('/home');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-slate-600">
          {mode === 'signup' ? 'Sign up to start building characters' : 'Log in to access your characters'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded font-medium transition-colors ${
              mode === 'signup' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`} 
            onClick={() => {
              setMode('signup');
              setMessage(null);
            }}
          >
            Sign Up
          </button>
          <button 
            className={`px-4 py-2 rounded font-medium transition-colors ${
              mode === 'login' && loginRole === 'Player'
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`} 
            onClick={() => {
              setMode('login');
              setLoginRole('Player');
              setMessage(null);
            }}
          >
            Login as Player
          </button>
          <button 
            className={`px-4 py-2 rounded font-medium transition-colors ${
              mode === 'login' && loginRole === 'Dungeon Master'
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`} 
            onClick={() => {
              setMode('login');
              setLoginRole('Dungeon Master');
              setMessage(null);
            }}
          >
            Login as DM
          </button>
        </div>

        <div className="space-y-3">
          <input 
            className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Username" 
            type="text"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
          <input 
            className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          
          {mode === 'signup' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Choose your role:</p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="role" 
                    value="Player" 
                    checked={role === 'Player'}
                    onChange={e => setRole(e.target.value as 'Player' | 'Dungeon Master')}
                    className="mr-2"
                  />
                  <span className="text-sm">Player</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="role" 
                    value="Dungeon Master" 
                    checked={role === 'Dungeon Master'}
                    onChange={e => setRole(e.target.value as 'Player' | 'Dungeon Master')}
                    className="mr-2"
                  />
                  <span className="text-sm">Dungeon Master</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <button 
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={submit}
          disabled={isLoading || !username || !password || (mode === 'login' && !loginRole)}
        >
          {isLoading ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Login')}
        </button>

        {message && (
          <div className={`p-3 rounded text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

      </div>
    </div>
  );
}

