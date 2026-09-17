import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'STUDENT': return '/dashboard';
      case 'STAFF': return '/staff/dashboard';
      case 'CARETAKER': return '/caretaker/dashboard';
      case 'HOSTEL_REPRESENTATIVE': return '/rep/dashboard';
      default: return '/admin/dashboard';
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 bg-rose-100 text-rose-700 rounded-full mb-4">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        You do not possess the required permissions to access this administrative section.
        Your current role is <span className="font-semibold text-slate-800">{user?.role || 'Guest'}</span>.
      </p>
      <div className="mt-6">
        <Link
          to={getHomePath()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
