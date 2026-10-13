import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  X,
  UserCheck,
  UserX,
  Plus,
  Eye,
  EyeOff,
  Upload,
  Pencil,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';
import authApi from '../../api/authApi';
import driverApi from '../../api/driverApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DR';

const EMPTY_DRIVER_FORM = {
  username: '',
  password: '',
  name: '',
  email: '',
  phone: '',
  age: '',
  licenseId: '',
  address: '',
  area: '',
  landmark: '',
  photo: null,
  licensePhoto: null,
};

const DriverForm = ({ initialData, isEdit = false, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(
    initialData
      ? {
          username: initialData.username || '',
          password: '',
          name: initialData.name || '',
          email: initialData.email && initialData.email !== 'N/A' ? initialData.email : '',
          phone: initialData.phone && initialData.phone !== 'N/A' ? initialData.phone : '',
          age: initialData.age || '',
          licenseId: initialData.licenseId && initialData.licenseId !== 'N/A' ? initialData.licenseId : '',
          address: initialData.address || '',
          area: initialData.area || '',
          landmark: initialData.landmark || '',
          photo: null,
          licensePhoto: null,
        }
      : EMPTY_DRIVER_FORM
  );

  const [previewPhoto, setPreviewPhoto] = useState(
    initialData?.photo ? resolveMediaUrl(initialData.photo) : null
  );
  const [previewLicense, setPreviewLicense] = useState(
    initialData?.licensePhoto ? resolveMediaUrl(initialData.licensePhoto) : null
  );
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!isEdit && !form.username.trim()) {
      errs.username = 'Username is required';
    }
    if (!isEdit && (!form.password || form.password.trim().length < 6)) {
      errs.password = 'Password must be at least 6 characters';
    } else if (isEdit && form.password && form.password.trim().length < 6) {
      errs.password = 'New password must be at least 6 characters';
    }
    if (!form.name.trim()) {
      errs.name = 'Full legal name is required';
    }
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('photo', file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('licensePhoto', file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewLicense(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== '') {
        fd.append(k, v);
      }
    });
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Account Credentials Section */}
      <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          <span>System Account Credentials</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormInput
            label="Username"
            required={!isEdit}
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            disabled={isEdit}
            placeholder="e.g. driver_rajesh"
            error={errors.username}
            hint={isEdit ? 'Username cannot be modified after registration' : 'Unique system login identifier'}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {isEdit ? 'Update Password (Optional)' : 'Initial Password'}
              {!isEdit && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep existing' : 'Min 6 characters'}
                className={`w-full h-10 px-3.5 pr-10 text-sm rounded-xl text-gray-900 border transition-all shadow-2xs focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:ring-purple-500/20 focus:border-purple-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-600 font-medium">{errors.password}</p>}
          </div>
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Driver Profile & Contact Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormInput
            label="Full Legal Name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Rajesh Sharma"
            error={errors.name}
          />
          <FormInput
            label="Email Address"
            required
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="driver@university.edu"
            error={errors.email}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FormInput
            label="Phone Number"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
          <FormInput
            label="Driver License ID"
            value={form.licenseId}
            onChange={(e) => set('licenseId', e.target.value)}
            placeholder="DL-0420110012345"
          />
          <FormInput
            label="Age"
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="e.g. 38"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-1">
            <FormInput
              label="Area / Campus Zone"
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              placeholder="e.g. North Campus"
            />
          </div>
          <div className="sm:col-span-2">
            <FormInput
              label="Landmark"
              value={form.landmark}
              onChange={(e) => set('landmark', e.target.value)}
              placeholder="e.g. Near Main Gate / University Housing"
            />
          </div>
        </div>

        <FormInput
          label="Residential Address"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Sector 12, University Campus Road, Block C"
        />
      </div>

      {/* Photos Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Profile Photo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Driver Photo (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl p-3 text-center transition-colors bg-gray-50/50">
            {previewPhoto ? (
              <div className="relative inline-block">
                <img
                  src={previewPhoto}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-2xs mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPhoto(null);
                    set('photo', null);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-700 shadow-sm"
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                <Upload className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-gray-700">Upload Portrait</span>
                <span className="text-[10px] text-gray-400">JPG or PNG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>
        </div>

        {/* License Photo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            License Card Photo (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl p-3 text-center transition-colors bg-gray-50/50">
            {previewLicense ? (
              <div className="relative inline-block">
                <img
                  src={previewLicense}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-2xs mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewLicense(null);
                    set('licensePhoto', null);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-700 shadow-sm"
                  title="Remove license photo"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                <Upload className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-gray-700">Upload License</span>
                <span className="text-[10px] text-gray-400">JPG or PNG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLicenseUpload} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Saving driver…</span>
            </>
          ) : (
            <span>{isEdit ? 'Save Changes' : 'Create Driver Account'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

const DriverCard = ({ driver, onView, onEdit, onDelete, onDeactivate, onActivate }) => {
  const name = driver.name || driver.username || 'Driver';
  const phone = driver.phone && driver.phone !== 'N/A' ? driver.phone : null;
  const email = driver.email && driver.email !== 'N/A' ? driver.email : null;
  const license = driver.licenseId && driver.licenseId !== 'N/A' ? driver.licenseId : null;
  const isInactive = driver.status?.toLowerCase() === 'inactive';
  const avatarUrl = resolveMediaUrl(driver.photo);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs hover:border-gray-300/80 transition-all flex flex-col justify-between h-full p-5">
      <div>
        {/* Top Header: Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden shadow-2xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{name}</h3>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isInactive
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {driver.status || 'Active'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusBadge status="Driver" size="xs" dot={false} />
                <span className="text-[11px] text-gray-400 font-mono truncate">
                  @{driver.username}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isInactive ? (
              <AdminActionButton
                action="activate"
                onClick={onActivate}
                title="Activate driver"
              />
            ) : (
              <AdminActionButton
                action="deactivate"
                onClick={onDeactivate}
                title="Deactivate driver"
              />
            )}
            <AdminActionButton action="edit" onClick={onEdit} title="Edit driver profile" />
            <AdminActionButton action="view" onClick={onView} title="View driver profile" />
            <AdminActionButton action="delete" onClick={onDelete} title="Remove driver" />
          </div>
        </div>

        {/* Contact info list */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-mono text-gray-700 truncate">{phone || 'No phone registered'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate text-gray-700">{email || 'No email registered'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-mono font-medium text-purple-700 truncate">
              {license ? `Lic: ${license}` : 'License: Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Verified Transit Operator
        </span>
        <button
          type="button"
          onClick={onView}
          className="text-purple-600 hover:text-purple-700 font-semibold"
        >
          View details →
        </button>
      </div>
    </div>
  );
};

const DriverDetailDrawer = ({ driver, onClose, onEdit, onActivate, onDeactivate }) => {
  if (!driver) return null;
  const name = driver.name || driver.username || 'Driver';
  const isInactive = driver.status?.toLowerCase() === 'inactive';
  const avatarUrl = resolveMediaUrl(driver.photo);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0 overflow-hidden shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                getInitials(name)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-purple-200">Authorized Operator</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isInactive ? 'bg-amber-400/30 text-amber-100' : 'bg-white/20 text-white'
                  }`}
                >
                  {driver.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors ml-3"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 space-y-3">
            {[
              ['Username', driver.username],
              ['Full Legal Name', driver.name],
              ['Email Address', driver.email],
              ['Phone Number', driver.phone],
              ['License Number', driver.licenseId],
              ['Age', driver.age],
              ['Area / Zone', driver.area],
              ['Landmark', driver.landmark],
              ['Address', driver.address],
              ['Account Role', 'Driver'],
              ['Status', driver.status || 'Active'],
            ].map(([label, val]) => (
              <div
                key={label}
                className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-sm font-bold text-gray-900 text-right">{val && val !== 'N/A' ? val : '—'}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(driver);
              }}
              className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            {isInactive ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onActivate(driver._id);
                }}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Reactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeactivate(driver._id);
                }}
                className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <UserX className="w-3.5 h-3.5" />
                Deactivate
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-800">
            <p className="font-semibold mb-1">Fleet Operations Authorization</p>
            <p className="leading-relaxed text-purple-700">
              Driver accounts are managed through the central university authentication service. Deactivating a driver prevents login and trip operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriversPage = () => {
  const { addToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [detail, setDetail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [delDrv, setDelDrv] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDrivers = useCallback(
    async (requestedPage = page, requestedSearch = search, requestedStatus = statusFilter) => {
      setLoading(true);
      setLoadError(false);
      try {
        const params = {
          page: requestedPage,
          limit: 10,
          search: requestedSearch,
        };
        if (requestedStatus && requestedStatus !== 'all') {
          params.status = requestedStatus;
        }

        const { data } = await authApi.getAllDrivers(params);
        const nextPagination = data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
        if (requestedPage > nextPagination.totalPages && nextPagination.totalPages > 0) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }
        setDrivers(Array.isArray(data.data) ? data.data : []);
        setPagination(nextPagination);
        setSummary(data.summary || { total: nextPagination.total, active: 0, inactive: 0 });
      } catch {
        setLoadError(true);
        addToast('Failed to load drivers', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addToast, page, search, statusFilter]
  );

  useEffect(() => {
    fetchDrivers(page, search, statusFilter);
  }, [fetchDrivers, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditDriver(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setEditDriver(driver);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editDriver) {
        await driverApi.updateDriver(editDriver._id, formData);
        addToast('Driver updated successfully', 'success');
      } else {
        await driverApi.createDriver(formData);
        addToast('Driver registered successfully', 'success');
      }
      setModalOpen(false);
      setEditDriver(null);
      fetchDrivers(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDelete = async (driver) => {
    try {
      const res = await driverApi.getDependencies(driver._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDelDrv(driver);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDelDrv(driver);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteUser(delDrv._id);
      addToast('Driver removed successfully', 'success');
      setDelDrv(null);
      fetchDrivers(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDelDrv(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to remove driver', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateDriver = async (driverId) => {
    const targetId = driverId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await driverApi.deactivate(targetId);
      addToast('Driver deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchDrivers(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate driver', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateDriver = async (driverId) => {
    try {
      await driverApi.reactivate(driverId);
      addToast('Driver reactivated successfully', 'success');
      fetchDrivers(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate driver', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Driver Management"
        description="Register and manage authorized university transit drivers, verified licenses, and active credentials"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Driver</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Drivers"
          value={loading ? <SkeletonStatValue /> : summary.total}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Registered transit operators"
        />
        <StatCard
          title="Active Drivers"
          value={loading ? <SkeletonStatValue /> : summary.active ?? (summary.total - (summary.inactive || 0))}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Authorized for active dispatch"
        />
        <StatCard
          title="Inactive Drivers"
          value={loading ? <SkeletonStatValue /> : summary.inactive || 0}
          icon={UserX}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Deactivated driver accounts"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search drivers by name, username, email, license…"
        debounceMs={350}
        filters={
          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All', count: summary.total },
              { id: 'active', label: 'Active', count: summary.active },
              { id: 'inactive', label: 'Inactive', count: summary.inactive },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setStatusFilter(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === f.id
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.label} {f.count !== undefined && f.count !== null ? `(${f.count})` : ''}
              </button>
            ))}
          </div>
        }
        onRefresh={() => fetchDrivers(page, search, statusFilter)}
        refreshing={loading}
        extra={
          <span className="text-xs text-gray-500 font-medium">
            {drivers.length} operator{drivers.length !== 1 ? 's' : ''} shown
          </span>
        }
      />

      {/* ── Driver Cards Grid ── */}
      {loading ? (
        <AdminSkeleton variant="card" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchDrivers(page, search, statusFilter)} />
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={Users}
            isSearch={Boolean(search || statusFilter !== 'all')}
            title={
              search || statusFilter !== 'all' ? 'No matching drivers found' : 'No drivers registered'
            }
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search terms or status filter.'
                : 'Click "Add Driver" above to register the first driver account.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <DriverCard
              key={d._id}
              driver={d}
              onView={() => setDetail(d)}
              onEdit={() => handleOpenEdit(d)}
              onDelete={() => handleRequestDelete(d)}
              onDeactivate={() => handleDeactivateDriver(d._id)}
              onActivate={() => handleReactivateDriver(d._id)}
            />
          ))}
        </div>
      )}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        loading={loading}
        onPageChange={(nextPage) => {
          if (nextPage >= 1 && nextPage <= pagination.totalPages) {
            setPage(nextPage);
          }
        }}
      />

      {/* ── Add / Edit Driver Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setEditDriver(null);
          }
        }}
        title={editDriver ? `Edit Driver Profile: ${editDriver.name || editDriver.username}` : 'Register New Transit Driver'}
        subtitle={
          editDriver
            ? 'Update contact details, license information, or credentials'
            : 'Create a driver account and assign official transit operator profile'
        }
        size="lg"
      >
        <DriverForm
          initialData={editDriver}
          isEdit={Boolean(editDriver)}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditDriver(null);
          }}
          loading={submitting}
        />
      </Modal>

      {/* ── Detail Drawer ── */}
      <DriverDetailDrawer
        driver={detail}
        onClose={() => setDetail(null)}
        onEdit={handleOpenEdit}
        onActivate={handleReactivateDriver}
        onDeactivate={handleDeactivateDriver}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delDrv)}
        onClose={() => setDelDrv(null)}
        onConfirm={handleDelete}
        title="Remove Driver Account?"
        description={`This will permanently remove "${delDrv?.name || delDrv?.username}" from the transit system.`}
        confirmLabel="Remove Driver"
        loading={deleting}
      />

      {/* ── Dependency / Safe Delete Modal ── */}
      <DependencyModal
        isOpen={depModalOpen}
        onClose={() => {
          setDepModalOpen(false);
          setDependencyData(null);
        }}
        dependencyData={dependencyData}
        onDeactivate={handleDeactivateDriver}
        loading={deactivating}
      />
    </div>
  );
};

export default DriversPage;
