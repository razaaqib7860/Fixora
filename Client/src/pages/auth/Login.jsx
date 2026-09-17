import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const demoAccounts = [
  { label: 'Student (Rahul)', email: 'rahul.sharma@college.edu', role: 'STUDENT', desc: 'Block A, Room 204' },
  { label: 'Staff (Electrician)', email: 'electrician@hostel.edu', role: 'STAFF', desc: 'Electrical Maintenance' },
  { label: 'Staff (Plumber)', email: 'plumber@hostel.edu', role: 'STAFF', desc: 'Plumbing Maintenance' },
  { label: 'Caretaker', email: 'caretaker@hostel.edu', role: 'CARETAKER', desc: 'Hostel Operations' },
  { label: 'Hostel Rep', email: 'rep@hostel.edu', role: 'HOSTEL_REPRESENTATIVE', desc: 'Student Council' },
  { label: 'Admin / Warden', email: 'admin@hostel.edu', role: 'ADMIN', desc: 'Hostel Administration' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Direct user according to role
      if (user.role === 'STUDENT') {
        navigate('/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else if (user.role === 'CARETAKER') {
        navigate('/caretaker/dashboard');
      } else if (user.role === 'HOSTEL_REPRESENTATIVE') {
        navigate('/rep/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-brand-800 text-white rounded-2xl shadow-md mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          College Hostel Portal
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to access complaint tracking and facility services
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                College / Official Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Student without an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Register with College Email
            </Link>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Test Personas (Click to auto-fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all ${
                    email === acc.email
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate font-medium">{acc.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.desc}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              All demo accounts password: <code className="font-mono text-slate-600">Password@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
