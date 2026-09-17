import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated as {user?.role.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Campus Hostel Facility & Complaint Management System. Manage facility requests, monitor ticket status, and coordinate hostel services.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {user?.role === 'STUDENT' && (
              <>
                <Link
                  to="/complaints/new"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Raise a Complaint</span>
                </Link>
                <Link
                  to="/complaints"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>My Complaints</span>
                </Link>
              </>
            )}

            {user?.role === 'STAFF' && (
              <Link
                to="/complaints"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                <span>View Assigned Tickets ({user?.assignedCategory})</span>
              </Link>
            )}

            {['ADMIN', 'WARDEN', 'CARETAKER', 'HOSTEL_REPRESENTATIVE'].includes(user?.role) && (
              <Link
                to="/complaints"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Open Operations Board</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Profile Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Assigned Block & Room</div>
            <div className="text-base font-bold text-slate-800">
              {user?.block || 'Administration'} {user?.roomNumber ? `• ${user?.roomNumber}` : ''}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">System Account Status</div>
            <div className="text-base font-bold text-emerald-700 flex items-center space-x-1">
              <span>Active & Verified</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Contact Phone</div>
            <div className="text-base font-bold text-slate-800">{user?.phoneNumber || 'Not provided'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
