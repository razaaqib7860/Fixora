import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Building,
  Home,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Shield,
  Save,
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [year, setYear] = useState(user?.year || 1);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/users/profile', {
        phoneNumber,
        branch,
        year: Number(year),
      });
      updateUser(res.data.user);
      setSuccessMsg('Profile details updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                {user.role.replace('_', ' ')}
              </span>
              {user.assignedCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Category: {user.assignedCategory}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>Registered: {new Date(user.createdAt).toLocaleDateString()}</div>
          <div className="mt-0.5 font-medium text-emerald-600 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Account Verified
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Fixed Institutional Info */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            Assigned Residence
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3 text-slate-700">
              <Building className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Hostel Block</div>
                <div className="font-semibold text-slate-800">{user.block || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-700">
              <Home className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Room Number</div>
                <div className="font-semibold text-slate-800">{user.roomNumber || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-700">
              <Mail className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs text-slate-400">Official College Email</div>
                <div className="font-semibold text-slate-800 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
            Note: Room and block allocations are managed by the hostel caretaker and warden. Contact administration to request room changes.
          </p>
        </div>

        {/* Right Column: Editable Contact & Academic Information */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4">
            Contact & Student Details
          </h2>

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Primary Phone Number
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Used by maintenance staff to coordinate room visits.</p>
            </div>

            {user.role === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Academic Branch
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">PG / PhD</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
