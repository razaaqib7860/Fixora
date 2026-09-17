import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CATEGORIES } from '../../utils/categories';
import AudioRecorder from '../../components/common/AudioRecorder';
import {
  PlusCircle,
  Building,
  Home,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Droplets,
  Wifi,
  Shield,
  HelpCircle,
  DoorClosed,
  Bath,
  Armchair,
  GlassWater,
} from 'lucide-react';

const categoryIcons = {
  Electrical: Zap,
  Plumbing: Droplets,
  Cleaning: Sparkles,
  Furniture: Armchair,
  'Internet/Wi-Fi': Wifi,
  Room: DoorClosed,
  Bathroom: Bath,
  Security: Shield,
  Water: GlassWater,
  Other: HelpCircle,
};

const RaiseComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Electrical');
  const [problemType, setProblemType] = useState('Fan not working');
  const [customProblem, setCustomProblem] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [block, setBlock] = useState(user?.block || 'Block A');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [audioFile, setAudioFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When category changes, reset problemType to the first problem of new category
  const handleCategoryChange = (catId) => {
    setCategory(catId);
    const selectedCat = CATEGORIES.find((c) => c.id === catId);
    if (selectedCat && selectedCat.problems.length > 0) {
      setProblemType(selectedCat.problems[0]);
    }
    setCustomProblem('');
  };

  // Image selection handling
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + imageFiles.length > 4) {
      setErrorMsg('You can upload a maximum of 4 images.');
      return;
    }

    const validImages = [];
    const newPreviews = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files (JPG, PNG, WEBP) are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image file size cannot exceed 10MB.');
        continue;
      }
      validImages.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...validImages]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      return setErrorMsg('Please describe your problem.');
    }

    if (problemType === 'Other' && !customProblem.trim()) {
      return setErrorMsg('Please specify your problem in the custom problem field.');
    }

    if (!roomNumber.trim()) {
      return setErrorMsg('Room number is required to locate the issue.');
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('problemType', problemType);
      if (customProblem.trim()) {
        formData.append('customProblem', customProblem.trim());
      }
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('block', block.trim());
      formData.append('roomNumber', roomNumber.trim());

      // Append image files
      imageFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      // Append voice recording if recorded
      if (audioFile) {
        formData.append('attachments', audioFile);
      }

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Navigate to the created complaint detail page
      navigate(`/complaints/${res.data.complaint._id}`, {
        state: { message: 'Complaint registered successfully!' },
      });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Failed to submit complaint. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const currentCategoryObj = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-50 text-brand-700 rounded-xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Raise a Complaint</h1>
            <p className="text-sm text-slate-500">
              Submit a maintenance or facility ticket. Your issue will be dispatched directly to the responsible staff.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Location Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Building className="w-4 h-4 text-brand-600" />
            <span>1. Location Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Hostel Block *
              </label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="Block A">Block A (Senior Boys)</option>
                <option value="Block B">Block B (Junior Boys)</option>
                <option value="Block C">Block C (Girls Wing 1)</option>
                <option value="Block D">Block D (Girls Wing 2)</option>
                <option value="PG Block">PG & Research Block</option>
                <option value="Dining Hall / Mess">Dining Hall / Mess</option>
                <option value="Common Facility Area">Common Facility Area</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Room Number / Precise Area *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. A-204 or 2nd Floor Bathroom"
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Pre-filled with your allocated room.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Category & Problem Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>2. Category & Nature of Problem</span>
          </h2>

          {/* Category Pills Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.id] || HelpCircle;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-brand-700' : 'text-slate-500'}`} />
                    <span className="text-xs font-medium leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Predefined Problems based on Category */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Common Problem ({category}) *
            </label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-slate-800"
            >
              {currentCategoryObj?.problems.map((prob) => (
                <option key={prob} value={prob}>
                  {prob}
                </option>
              ))}
            </select>
          </div>

          {/* Custom problem input if 'Other' selected */}
          {problemType === 'Other' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Specify Custom Problem Title *
              </label>
              <input
                type="text"
                required
                value={customProblem}
                onChange={(e) => setCustomProblem(e.target.value)}
                placeholder="Brief title of the issue"
                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}

          {/* Priority */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Severity / Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'LOW', label: 'Low', desc: 'Minor issue' },
                { id: 'MEDIUM', label: 'Medium', desc: 'Standard SLA' },
                { id: 'HIGH', label: 'High', desc: 'Urgent attention' },
                { id: 'EMERGENCY', label: 'Emergency', desc: 'Immediate (1h)' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    priority === p.id
                      ? p.id === 'EMERGENCY'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500 font-bold'
                        : 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-500 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[10px] text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Detailed Description */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>3. Description of Issue</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Describe your problem in detail *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when the issue started, the specific symptoms, or any helpful instructions for maintenance staff..."
              className="block w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Section 4: Attachments (Image Upload + Voice Recording) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-brand-600" />
            <span>4. Attachments (Images & Voice Note)</span>
          </h2>

          {/* Image Uploader */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Upload Photos of Damage / Issue (Max 4 photos, up to 10MB each)
            </label>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Image Previews */}
              {imagePreviews.map((url, idx) => (
                <div key={url} className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden shadow-2xs group">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {imageFiles.length < 4 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-brand-600">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">+ Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Integrated Browser Voice Recorder */}
          <AudioRecorder
            onAudioReady={(file) => setAudioFile(file)}
            onAudioRemoved={() => setAudioFile(null)}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{submitting ? 'Registering Ticket...' : 'Submit Complaint'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RaiseComplaint;
