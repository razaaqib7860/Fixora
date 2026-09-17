import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Building2,
  Bell,
  Menu,
} from 'lucide-react';

const roleBadgeColors = {
  STUDENT: 'bg-blue-100 text-blue-800 border-blue-200',
  STAFF: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CARETAKER: 'bg-purple-100 text-purple-800 border-purple-200',
  HOSTEL_REPRESENTATIVE: 'bg-amber-100 text-amber-800 border-amber-200',
  ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
  WARDEN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-800 text-white rounded-lg shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                Campus Hostel Portal
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">
                Complaint & Facility Tracking System
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Info, Role Badge & Logout */}
        {user ? (
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-snug">
                {user.name}
              </div>
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    roleBadgeColors[user.role] || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {user.role.replace('_', ' ')}
                </span>
                {user.block && (
                  <span className="text-xs text-slate-500 font-medium">
                    • {user.block} {user.roomNumber ? `(${user.roomNumber})` : ''}
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              className="p-2 text-slate-600 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="My Profile"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800 px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-brand-700 hover:bg-brand-800 text-white px-4 py-1.5 rounded-lg shadow-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
