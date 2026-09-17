import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft,
  Building,
  Home,
  Clock,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  FileText,
  Wrench,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  Star,
  ExternalLink,
  Plus,
  Send,
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
  IN_PROGRESS: 'Work in Progress',
  RESOLVED_AWAITING_CONFIRMATION: 'Resolved — Awaiting Student Confirmation',
  CLOSED: 'Closed & Verified',
  REOPENED: 'Reopened by Student',
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals state
  const [activeImage, setActiveImage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states for modals
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [workNote, setWorkNote] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignComment, setAssignComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data.complaint);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load complaint details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  // Fetch staff list if Caretaker or Admin
  useEffect(() => {
    if (user && ['CARETAKER', 'ADMIN', 'WARDEN'].includes(user.role)) {
      api.get('/users/staff')
        .then((res) => setStaffList(res.data.staff || []))
        .catch((err) => console.warn('Could not fetch staff list:', err));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{error || 'Complaint not found'}</h2>
        <div>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCreator = user && complaint.createdBy && user._id === complaint.createdBy._id;
  const isStaffOrAdmin = user && ['STAFF', 'CARETAKER', 'ADMIN', 'WARDEN'].includes(user.role);

  // Student confirms resolution -> CLOSED
  const handleConfirmClose = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.post(`/complaints/${id}/verify`, {
        rating,
        comment: feedbackComment,
      });
      setComplaint(res.data.complaint);
      setShowConfirmModal(false);
      setActionSuccess('Complaint confirmed as resolved and successfully closed!');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to verify resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  // Student rejects resolution -> REOPENED
  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      return setActionError('Please state why the problem is not fixed.');
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.post(`/complaints/${id}/reopen`, {
        reason: reopenReason,
      });
      setComplaint(res.data.complaint);
      setShowReopenModal(false);
      setActionSuccess('Complaint reopened and returned to the active queue for staff.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff starts work -> IN_PROGRESS
  const handleStartWork = async () => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.patch(`/complaints/${id}/status`, {
        status: 'IN_PROGRESS',
        note: 'Staff commenced repair work at room.',
      });
      setComplaint(res.data.complaint);
      setActionSuccess('Work started. Ticket status updated to IN PROGRESS.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff marks resolved -> RESOLVED_AWAITING_CONFIRMATION
  const handleMarkResolved = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      return setActionError('A resolution note describing the fix is required.');
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.patch(`/complaints/${id}/status`, {
        status: 'RESOLVED_AWAITING_CONFIRMATION',
        note: resolutionNote,
      });
      setComplaint(res.data.complaint);
      setShowResolveModal(false);
      setActionSuccess('Marked as resolved! The student must now inspect and verify before closure.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to mark resolved.');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff adds progress note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!workNote.trim()) {
      return setActionError('Note cannot be blank.');
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.post(`/complaints/${id}/notes`, {
        comment: workNote,
      });
      setComplaint(res.data.complaint);
      setShowNoteModal(false);
      setWorkNote('');
      setActionSuccess('Work note added to timeline.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add work note.');
    } finally {
      setActionLoading(false);
    }
  };

  // Caretaker/Admin assigns staff
  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      return setActionError('Please select a staff member.');
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.patch(`/complaints/${id}/assign`, {
        staffId: selectedStaffId,
        comment: assignComment || undefined,
      });
      setComplaint(res.data.complaint);
      setShowAssignModal(false);
      setActionSuccess('Staff assigned successfully.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign staff.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          Ticket: {complaint.complaintId}
        </span>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-base font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                {complaint.complaintId}
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  statusBadgeStyles[complaint.status] || 'bg-slate-100 text-slate-800'
                }`}
              >
                {statusLabels[complaint.status] || complaint.status}
              </span>
              {complaint.isOverdue && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  OVERDUE
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {complaint.problemType}
              {complaint.customProblem ? ` - ${complaint.customProblem}` : ''}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Category & Priority</span>
            <div className="flex items-center sm:justify-end space-x-2 mt-0.5">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                {complaint.category}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  complaint.priority === 'EMERGENCY'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-brand-50 text-brand-800'
                }`}
              >
                {complaint.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Location & Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block">Hostel Block</span>
            <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{complaint.block}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Room / Area</span>
            <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>{complaint.roomNumber}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Raised On</span>
            <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">SLA Deadline</span>
            <span
              className={`font-semibold flex items-center space-x-1 mt-0.5 ${
                complaint.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(complaint.slaDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🚨 CORE STATE MACHINE RULE: STUDENT VERIFICATION BANNER 🚨 */}
      {complaint.status === 'RESOLVED_AWAITING_CONFIRMATION' && (
        <div className="bg-purple-50 border-2 border-purple-400 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shrink-0 mt-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-base font-bold text-purple-950">
                  Staff Reported Issue Fixed — Resident Verification Required
                </h2>
                <p className="text-sm text-purple-800 mt-0.5">
                  {complaint.assignedStaff?.name || 'Maintenance Staff'} submitted a resolution note:
                </p>
              </div>

              {complaint.resolutionNote && (
                <div className="p-3 bg-white/90 rounded-xl border border-purple-200 text-sm font-medium italic text-purple-900">
                  "{complaint.resolutionNote}"
                </div>
              )}

              {isCreator ? (
                <div className="pt-3 border-t border-purple-200">
                  <p className="text-sm font-bold text-purple-950 mb-3">
                    Has the problem actually been fixed in your room?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>YES, CLOSE COMPLAINT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>NO, REOPEN COMPLAINT</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-purple-700 italic">
                  Note: Staff resolved ≠ Closed. Only the complainant ({complaint.createdBy?.name}) can confirm resolution and finally close this ticket.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLOSED FEEDBACK DISPLAY */}
      {complaint.status === 'CLOSED' && complaint.studentFeedback?.rating && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">Complaint Closed & Verified by Student</h3>
            <div className="flex items-center space-x-1 mt-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= complaint.studentFeedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-600 font-semibold ml-2">
                ({complaint.studentFeedback.rating} / 5 Stars)
              </span>
            </div>
            {complaint.studentFeedback.comment && (
              <p className="text-xs text-slate-600 mt-1 italic">
                "{complaint.studentFeedback.comment}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* REOPENED WARNING DISPLAY */}
      {complaint.status === 'REOPENED' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-600 text-white rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">
              Complaint Reopened by Student (Reopen Count: {complaint.reopenCount})
            </h3>
            <p className="text-xs text-rose-700 mt-0.5 font-medium">
              Student feedback: "{complaint.reopenReason}"
            </p>
          </div>
        </div>
      )}

      {/* STAFF & ADMINISTRATIVE ACTIONS TOOLBAR */}
      {isStaffOrAdmin && complaint.status !== 'CLOSED' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-brand-600" />
            <span>Staff & Administrative Work Actions</span>
          </h2>

          <div className="flex flex-wrap gap-3">
            {/* Start work */}
            {['PENDING', 'ASSIGNED', 'REOPENED'].includes(complaint.status) && (
              <button
                type="button"
                onClick={handleStartWork}
                disabled={actionLoading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Wrench className="w-4 h-4" />
                <span>Start Repair Work</span>
              </button>
            )}

            {/* Add work note */}
            <button
              type="button"
              onClick={() => setShowNoteModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add Progress Note</span>
            </button>

            {/* Mark resolved */}
            {['IN_PROGRESS', 'ASSIGNED'].includes(complaint.status) && (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved</span>
              </button>
            )}

            {/* Assign staff (Caretaker/Admin) */}
            {['CARETAKER', 'ADMIN', 'WARDEN'].includes(user.role) && (
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{complaint.assignedStaff ? 'Reassign Staff' : 'Assign to Staff'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Attachments, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Description of Problem</span>
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Attachments Card */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                Media Attachments ({complaint.attachments.length})
              </h2>

              {/* Images Grid */}
              {complaint.attachments.some((a) => a.fileType === 'IMAGE') && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600">Attached Photos</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {complaint.attachments
                      .filter((a) => a.fileType === 'IMAGE')
                      .map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveImage(img.url)}
                          className="aspect-square rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-brand-500 transition-all group relative shadow-2xs"
                        >
                          <img
                            src={img.url}
                            alt="Attachment"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            Click to expand
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {complaint.attachments.some((a) => a.fileType === 'AUDIO') && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-brand-600" />
                    <span>Recorded Voice Message</span>
                  </div>
                  {complaint.attachments
                    .filter((a) => a.fileType === 'AUDIO')
                    .map((audio, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3"
                      >
                        <audio controls src={audio.url} className="w-full h-9 rounded-lg">
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Chronological Complaint Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Complaint Progress Timeline ({complaint.timeline.length} events)</span>
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-brand-600 ring-4 ring-white"></div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {event.role}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {event.comment && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        {event.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Student Info & Staff Assignment */}
        <div className="space-y-6">
          {/* Creator Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Complainant Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-slate-900">{complaint.createdBy?.name}</div>
              <div className="text-xs text-slate-500">{complaint.createdBy?.email}</div>
              <div className="text-xs text-slate-500 font-medium">
                Phone: {complaint.createdBy?.phoneNumber || 'N/A'}
              </div>
              <div className="text-xs text-slate-500">
                Allocated: {complaint.createdBy?.block} Room {complaint.createdBy?.roomNumber}
              </div>
            </div>
          </div>

          {/* Assigned Staff Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              <span>Assigned Maintenance Staff</span>
            </h2>
            {complaint.assignedStaff ? (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-slate-900">{complaint.assignedStaff.name}</div>
                <div className="text-xs text-slate-500">{complaint.assignedStaff.email}</div>
                <div className="text-xs text-emerald-700 font-medium">
                  Category: {complaint.assignedStaff.assignedCategory}
                </div>
                <div className="text-xs text-slate-500">Contact: {complaint.assignedStaff.phoneNumber}</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">
                Staff not yet dispatched.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Student Verification & Close */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold">Confirm Problem Resolution</h3>
            </div>
            <p className="text-xs text-slate-600">
              Confirming will mark this complaint as permanently <b>CLOSED</b>. Please rate your satisfaction with the repair work:
            </p>

            <form onSubmit={handleConfirmClose} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Rating (1 to 5 Stars)
                </label>
                <div className="flex space-x-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feedback / Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Work was done quickly and cleanly."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Closing...' : 'Confirm & Close Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Student Reopen Ticket */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold">Reopen Complaint Ticket</h3>
            </div>
            <p className="text-xs text-slate-600">
              Please explain why the issue is not fixed so maintenance staff can return and address the remaining problem.
            </p>

            <form onSubmit={handleReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Problem Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. The leak resumed after 2 hours. Water is still dripping beneath the pipe."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Reopening...' : 'Reopen Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Staff Mark Resolved */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-purple-800">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold">Mark Complaint as Resolved</h3>
            </div>
            <p className="text-xs text-slate-600">
              Explain what repairs were conducted. The ticket will transition to <b>RESOLVED — AWAITING CONFIRMATION</b> until the resident student inspects and confirms the fix.
            </p>

            <form onSubmit={handleMarkResolved} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe the repair actions taken (e.g. Replaced leaking valve, tested flow for 15 mins)."
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
                  {actionLoading ? 'Submitting...' : 'Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Staff Work Note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <MessageSquare className="w-6 h-6 text-brand-600" />
              <h3 className="text-base font-bold">Add Progress / Work Note</h3>
            </div>
            <p className="text-xs text-slate-600">
              Record a work log or intermediate update on the complaint timeline without changing the ticket status.
            </p>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Progress Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={workNote}
                  onChange={(e) => setWorkNote(e.target.value)}
                  placeholder="e.g. Inspected room, replacement spare parts ordered from main store."
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

      {/* MODAL 5: Assign Staff */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-brand-800">
              <User className="w-6 h-6" />
              <h3 className="text-base font-bold">Assign Ticket to Staff</h3>
            </div>
            <p className="text-xs text-slate-600">
              Assign complaint <span className="font-bold">{complaint.complaintId}</span> ({complaint.category}) to an active maintenance staff member.
            </p>

            <form onSubmit={handleAssignStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Staff Member *
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.assignedCategory || 'General'}) • {st.phoneNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={assignComment}
                  onChange={(e) => setAssignComment(e.target.value)}
                  placeholder="e.g. Please carry high-wattage replacement bulbs."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal Lightbox */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={activeImage}
              alt="Expanded"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-2 right-2 px-3 py-1 bg-black/60 text-white text-xs font-bold rounded-full cursor-pointer"
            >
              Close (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
