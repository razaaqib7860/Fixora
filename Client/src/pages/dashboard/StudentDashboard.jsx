import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Zap,
  Droplets,
  Sparkles,
  Wifi,
  Shield,
  HelpCircle,
  Building,
  Calendar,
} from 'lucide-react';

const statusBadgeStyles = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  RESOLVED_AWAITING_CONFIRMATION: 'bg-purple-100 text-purple-800 border-purple-300 font-bold animate-pulse',
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REOPENED: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
};

const statusLabels = {
  PENDING: 'Pending Assignment',
  ASSIGNED: 'Staff Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED_AWAITING_CONFIRMATION: 'Action Required: Verify Fix',
  CLOSED: 'Closed & Verified',
  REOPENED: 'Reopened',
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    awaitingConfirmation: 0,
    closed: 0,
    reopened: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats/summary'),
        api.get('/complaints?limit=6'),
      ]);
      setStats(statsRes.data.stats);
      setRecentComplaints(complaintsRes.data.complaints);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not load complaints data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Greeting and Primary CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 inline-block px-3 py-1 rounded-full mb-2">
              Student Resident Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Allocated: <span className="font-semibold text-slate-800">{user?.block}</span> • Room <span className="font-semibold text-slate-800">{user?.roomNumber}</span>
            </p>
          </div>

          {/* Primary Action Button */}
          <Link
            to="/complaints/new"
            className="inline-flex items-center space-x-2.5 px-6 py-3.5 bg-brand-700 hover:bg-brand-800 text-white text-base font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Raise a Complaint</span>
          </Link>
        </div>
      </div>

      {/* Verification Attention Callout (if tickets awaiting student confirmation) */}
      {stats.awaitingConfirmation > 0 && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-purple-900">
                Action Required: {stats.awaitingConfirmation} Ticket{stats.awaitingConfirmation > 1 ? 's' : ''} Awaiting Your Verification
              </h2>
              <p className="text-xs text-purple-700 mt-0.5">
                Staff have marked the work as fixed. Please inspect the repair and confirm resolution to close the ticket, or reopen if not fixed.
              </p>
            </div>
          </div>
          <Link
            to="/complaints?status=RESOLVED_AWAITING_CONFIRMATION"
            className="inline-flex items-center space-x-1 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Inspect & Confirm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Complaints</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.active}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pending, Assigned, In Progress</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Awaiting Confirmation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting Your Confirmation</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{stats.awaitingConfirmation}</div>
            <div className="text-[11px] text-purple-600 mt-0.5">Staff resolved ≠ closed</div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Closed Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Closed & Resolved</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.closed}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Verified by you</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Complaints</h2>
            <p className="text-xs text-slate-500">Track current tickets and verify completed repairs</p>
          </div>
          <Link
            to="/complaints"
            className="inline-flex items-center space-x-1 text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            <span>View All ({stats.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading your complaints...
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Complaints Raised Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              If you are facing any issues with electrical fixtures, plumbing, water, cleanliness, or Wi-Fi, click below to raise a ticket.
            </p>
            <div className="mt-4">
              <Link
                to="/complaints/new"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-2xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise Complaint Now</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentComplaints.map((c) => (
              <Link
                key={c._id}
                to={`/complaints/${c._id}`}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group block"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {c.complaintId}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        statusBadgeStyles[c.status] || 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {statusLabels[c.status] || c.status}
                    </span>
                    {c.priority === 'EMERGENCY' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        EMERGENCY
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors truncate">
                    {c.problemType}
                    {c.customProblem ? `: ${c.customProblem}` : ''}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>{c.block} ({c.roomNumber})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Raised: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </span>
                    {c.attachments?.length > 0 && (
                      <span className="text-brand-700 font-medium">
                        {c.attachments.length} attachment{c.attachments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <span className="text-xs font-semibold text-brand-700 group-hover:underline">
                    View Timeline
                  </span>
                  <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
