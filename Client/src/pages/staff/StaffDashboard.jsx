import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Building,
  Home,
  User,
  Phone,
  ArrowRight,
  MessageSquare,
  Search,
  Filter,
  Volume2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const statusBadgeStyles = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  RESOLVED_AWAITING_CONFIRMATION: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REOPENED: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    awaitingConfirmation: 0,
    reopened: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (blockFilter) params.block = blockFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats/summary'),
        api.get('/complaints', { params }),
      ]);

      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [statusFilter, priorityFilter, blockFilter]);

  const handleStartWork = async (cId) => {
    setActionLoading(true);
    try {
      await api.patch(`/complaints/${cId}/status`, {
        status: 'IN_PROGRESS',
        note: 'Staff commenced maintenance at site.',
      });
      setBannerMsg('Work started. Ticket status updated to IN PROGRESS.');
      fetchStaffData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!modalText.trim()) return alert('Resolution note is required.');

    setActionLoading(true);
    try {
      await api.patch(`/complaints/${selectedComplaint._id}/status`, {
        status: 'RESOLVED_AWAITING_CONFIRMATION',
        note: modalText.trim(),
      });
      setShowResolveModal(false);
      setModalText('');
      setBannerMsg('Ticket marked as resolved. Student confirmation requested.');
      fetchStaffData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!modalText.trim()) return alert('Note cannot be blank.');

    setActionLoading(true);
    try {
      await api.post(`/complaints/${selectedComplaint._id}/notes`, {
        comment: modalText.trim(),
      });
      setShowNoteModal(false);
      setModalText('');
      setBannerMsg('Progress note added to timeline.');
      fetchStaffData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add work note.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full mb-2">
            Maintenance Staff Desk • {user?.assignedCategory || 'General Maintenance'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Workboard: {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage assigned repair orders, log work updates, and resolve student tickets.
          </p>
        </div>

        <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-400">Designated Department</div>
          <div className="text-base font-bold text-slate-800">{user?.assignedCategory || 'All Categories'}</div>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg('')} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Urgent Reopened Banner */}
      {stats.reopened > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs flex items-start space-x-3.5">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-900">
              Urgent Action: {stats.reopened} Reopened Ticket{stats.reopened > 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-rose-700 mt-0.5">
              The student inspected the previous repair and reported that the problem is not fixed. Please prioritize these tickets.
            </p>
          </div>
        </div>
      )}

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === '' ? 'border-brand-600 bg-brand-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">All Tasks</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </button>

        <button
          onClick={() => setStatusFilter('ASSIGNED')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'ASSIGNED' ? 'border-blue-600 bg-blue-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Assigned</div>
          <div className="text-2xl font-black text-blue-800 mt-1">{stats.assigned}</div>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'IN_PROGRESS' ? 'border-indigo-600 bg-indigo-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">In Progress</div>
          <div className="text-2xl font-black text-indigo-800 mt-1">{stats.inProgress}</div>
        </button>

        <button
          onClick={() => setStatusFilter('RESOLVED_AWAITING_CONFIRMATION')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'RESOLVED_AWAITING_CONFIRMATION' ? 'border-purple-600 bg-purple-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600">Awaiting Verify</div>
          <div className="text-2xl font-black text-purple-800 mt-1">{stats.awaitingConfirmation}</div>
        </button>

        <button
          onClick={() => setStatusFilter('REOPENED')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'REOPENED' ? 'border-rose-600 bg-rose-50 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Reopened</div>
          <div className="text-2xl font-black text-rose-800 mt-1">{stats.reopened}</div>
        </button>
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStaffData();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, room, student, or issue..."
              className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="">All Blocks</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
              <option value="Block D">Block D</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Staff Complaint Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading assigned maintenance tickets...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Tickets Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You currently have no maintenance orders under the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
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
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    {c.priority === 'EMERGENCY' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        EMERGENCY
                      </span>
                    )}
                    {c.isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SLA: {new Date(c.slaDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Main description & Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900">
                      {c.problemType}
                      {c.customProblem ? `: ${c.customProblem}` : ''}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                    {/* Media preview snippet */}
                    {c.attachments?.length > 0 && (
                      <div className="flex items-center space-x-3 pt-1">
                        {c.attachments.some((a) => a.fileType === 'IMAGE') && (
                          <span className="text-xs text-brand-700 font-semibold flex items-center space-x-1">
                            <span>📷 {c.attachments.filter((a) => a.fileType === 'IMAGE').length} Photo(s)</span>
                          </span>
                        )}
                        {c.attachments.some((a) => a.fileType === 'AUDIO') && (
                          <span className="text-xs text-purple-700 font-semibold flex items-center space-x-1">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Voice Note Attached</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Complainant & Location details */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.block} • Room {c.roomNumber}</span>
                    </div>
                    <div className="text-slate-600 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.createdBy?.name}</span>
                    </div>
                    {c.createdBy?.phoneNumber && (
                      <div className="text-slate-700 font-medium flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={`tel:${c.createdBy.phoneNumber}`} className="hover:underline">
                          {c.createdBy.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* If Reopened, show reopen reason callout */}
                {c.status === 'REOPENED' && c.reopenReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                    ⚠️ <b>Student reported not fixed:</b> "{c.reopenReason}"
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Start Work Button */}
                    {['PENDING', 'ASSIGNED', 'REOPENED'].includes(c.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleStartWork(c._id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        Start Work
                      </button>
                    )}

                    {/* Add Work Note */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setShowNoteModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      + Add Note
                    </button>

                    {/* Mark Resolved */}
                    {['IN_PROGRESS', 'ASSIGNED'].includes(c.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComplaint(c);
                          setShowResolveModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/complaints/${c._id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-brand-700 hover:text-brand-800"
                  >
                    <span>Full Ticket & Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESOLUTION MODAL */}
      {showResolveModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-purple-800">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold">Mark Ticket as Resolved</h3>
            </div>
            <p className="text-xs text-slate-600">
              Provide a resolution note for ticket <span className="font-bold">{selectedComplaint.complaintId}</span> ({selectedComplaint.block}, Room {selectedComplaint.roomNumber}):
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Work Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="Explain what was replaced or repaired..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORK NOTE MODAL */}
      {showNoteModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <MessageSquare className="w-6 h-6 text-brand-600" />
              <h3 className="text-base font-bold">Add Work Progress Note</h3>
            </div>
            <p className="text-xs text-slate-600">
              Add an intermediate update to ticket <span className="font-bold">{selectedComplaint.complaintId}</span>:
            </p>

            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="e.g. Spare motor ordered, technician returning at 4 PM..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
