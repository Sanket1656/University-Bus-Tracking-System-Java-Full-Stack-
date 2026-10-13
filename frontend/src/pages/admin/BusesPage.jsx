import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Bus, Pencil, Trash2, Eye, Upload, X, ShieldAlert, Sparkles } from 'lucide-react';
import busApi from '../../api/busApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import FormInput from '../../components/ui/FormInput';
import SelectInput from '../../components/ui/SelectInput';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const EMPTY_FORM = {
  busName: '',
  busNumber: '',
  busRegistrationNumber: '',
  busType: 'Non-Ac',
  busCapacity: '',
  busStatus: 'active',
  busPhoto: null,
};

const BusForm = ({ initial, onSubmit, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [preview, setPreview] = useState(initial?.busPhoto || null);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.busName.trim()) e.busName = 'Bus name is required';
    if (!form.busNumber.trim()) e.busNumber = 'Bus number is required';
    if (!form.busRegistrationNumber.trim()) e.busRegistrationNumber = 'Registration is required';
    if (!form.busCapacity) e.busCapacity = 'Capacity is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    set('busPhoto', f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== '') fd.append(k, v);
    });
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
          Bus Photo
        </label>
        <div
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
            preview ? 'border-purple-200 bg-purple-50/20' : 'border-gray-200 hover:border-purple-300 bg-gray-50/50'
          }`}
        >
          {preview ? (
            <div className="relative inline-block max-w-full">
              <img
                src={preview}
                alt="preview"
                className="w-full max-h-40 object-cover rounded-lg border border-purple-100 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  set('busPhoto', null);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-700 shadow-sm"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center py-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Click to upload vehicle photo</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG or WEBP up to 5MB</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Bus Name"
          required
          value={form.busName}
          onChange={(e) => set('busName', e.target.value)}
          error={errors.busName}
          placeholder="e.g. Campus Express"
        />
        <FormInput
          label="Bus Number"
          required
          value={form.busNumber}
          onChange={(e) => set('busNumber', e.target.value)}
          error={errors.busNumber}
          placeholder="e.g. BUS-01"
        />
      </div>

      <FormInput
        label="Registration Number"
        required
        value={form.busRegistrationNumber}
        onChange={(e) => set('busRegistrationNumber', e.target.value)}
        error={errors.busRegistrationNumber}
        placeholder="e.g. GJ-05-AB-1234"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectInput
          label="Type"
          value={form.busType}
          onChange={(e) => set('busType', e.target.value)}
          options={[
            { value: 'Non-Ac', label: 'Non-AC' },
            { value: 'Ac', label: 'AC' },
          ]}
        />
        <FormInput
          label="Capacity (Seats)"
          required
          type="number"
          min="1"
          value={form.busCapacity}
          onChange={(e) => set('busCapacity', e.target.value)}
          error={errors.busCapacity}
          placeholder="e.g. 52"
        />
        <SelectInput
          label="Status"
          value={form.busStatus}
          onChange={(e) => set('busStatus', e.target.value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'maintenance', label: 'Maintenance' },
          ]}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors shadow-xs"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          )}
          <span>{initial ? 'Save Changes' : 'Add Bus'}</span>
        </button>
      </div>
    </form>
  );
};

const BusDetailDrawer = ({ bus, onClose, onEdit }) => {
  if (!bus) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{bus.busName}</h2>
              <StatusBadge status={bus.busStatus} size="xs" />
            </div>
            <p className="text-purple-200 font-mono text-xs mt-0.5">{bus.busRegistrationNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              title="Edit bus"
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {bus.busPhoto ? (
            <img
              src={resolveMediaUrl(bus.busPhoto)}
              alt={bus.busName}
              className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-xs"
            />
          ) : (
            <div className="w-full h-36 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Bus className="w-8 h-8 mb-1" />
              <span className="text-xs">No vehicle photo uploaded</span>
            </div>
          )}

          <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 space-y-3">
            {[
              ['Bus Name', bus.busName],
              ['Bus Number', bus.busNumber],
              ['Registration Number', bus.busRegistrationNumber],
              ['Air Conditioning', bus.busType === 'Ac' ? 'AC' : 'Non-AC'],
              ['Seating Capacity', bus.busCapacity ? `${bus.busCapacity} seats` : '—'],
              ['Vehicle Status', <StatusBadge key="status" status={bus.busStatus} />],
            ].map(([k, v]) => (
              <div
                key={typeof k === 'string' ? k : 'item'}
                className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{k}</span>
                <span className="text-sm font-bold text-gray-900">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BusesPage = () => {
  const { addToast } = useToast();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, maintenance: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editBus, setEditBus] = useState(null);
  const [detailBus, setDetailBus] = useState(null);
  const [delBus, setDelBus] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBuses = useCallback(async (requestedPage = page, requestedSearch = search, requestedStatus = statusFilter) => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await busApi.getAll({
        page: requestedPage,
        limit: 10,
        search: requestedSearch,
        status: requestedStatus,
      });
      const nextPagination = data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
      if (requestedPage > nextPagination.totalPages) {
        setPage(Math.max(1, nextPagination.totalPages));
        return;
      }
      setBuses(data.data || []);
      setPagination(nextPagination);
      setSummary(data.summary || { total: nextPagination.total, active: 0, inactive: 0, maintenance: 0 });
    } catch {
      setLoadError(true);
      addToast('Failed to load buses', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, page, search, statusFilter]);

  useEffect(() => {
    fetchBuses(page, search, statusFilter);
  }, [fetchBuses, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSubmit = async (fd) => {
    setSaving(true);
    try {
      if (editBus) {
        await busApi.update(editBus._id, fd);
        addToast('Bus updated successfully', 'success');
      } else {
        await busApi.create(fd);
        addToast('Bus added successfully', 'success');
      }
      setModalOpen(false);
      setEditBus(null);
      fetchBuses(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save bus', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = async (bus) => {
    try {
      const res = await busApi.getDependencies(bus._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDelBus(bus);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDelBus(bus);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await busApi.delete(delBus._id);
      addToast('Bus deleted successfully', 'success');
      setDelBus(null);
      fetchBuses(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDelBus(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to delete bus', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateBus = async (busId) => {
    const targetId = busId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await busApi.deactivate(targetId);
      addToast('Bus deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchBuses(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate bus', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateBus = async (busId) => {
    try {
      await busApi.reactivate(busId);
      addToast('Bus reactivated successfully', 'success');
      fetchBuses(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate bus', 'error');
    }
  };

  const stats = useMemo(() => {
    return {
      total: summary.total,
      active: summary.active,
      inactive: summary.inactive,
      maintenance: summary.maintenance,
    };
  }, [summary]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Bus Management"
        description="Manage your university fleet, monitor vehicle status, and assign capacities"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={() => {
              setEditBus(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Buses"
          value={loading ? <SkeletonStatValue /> : stats.total}
          icon={Bus}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Registered fleet size"
        />
        <StatCard
          title="Active Buses"
          value={loading ? <SkeletonStatValue /> : stats.active}
          icon={Bus}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="In active service"
        />
        <StatCard
          title="Inactive Buses"
          value={loading ? <SkeletonStatValue /> : stats.inactive}
          icon={Bus}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          sub="Out of service"
        />
        <StatCard
          title="Maintenance"
          value={loading ? <SkeletonStatValue /> : stats.maintenance}
          icon={Bus}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Under inspection / repair"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search buses by name, number, registration…"
        debounceMs={350}
        onRefresh={() => fetchBuses(page, search, statusFilter)}
        refreshing={loading}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3.5 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        }
        extra={
          <span className="text-xs text-gray-500 font-medium">
            Showing {buses.length} of {pagination.total} buses
          </span>
        }
      />

      {/* ── Data Surface ── */}
      {loading ? (
        <AdminSkeleton variant="table" rows={6} columns={6} />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchBuses(page, search, statusFilter)} />
      ) : buses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={Bus}
            isSearch={Boolean(search || statusFilter !== 'all')}
            title={search || statusFilter !== 'all' ? 'No buses match your filter' : 'No buses registered yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try clearing the search query or status filter to see other fleet records.'
                : 'Get started by registering your first university bus vehicle.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  + Add Bus
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Bus Number
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-100">
                          {bus.busPhoto ? (
                            <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Bus className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{bus.busName}</p>
                          <p className="text-xs text-gray-400 font-mono">{bus.busNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono font-semibold text-gray-700">
                      {bus.busNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                        {bus.busRegistrationNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">
                      {bus.busType === 'Ac' ? 'AC' : 'Non-AC'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-700 font-semibold">
                      {bus.busCapacity} <span className="text-gray-400 font-normal">seats</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={bus.busStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <AdminActionButton
                          action="view"
                          onClick={() => setDetailBus(bus)}
                          title="View bus details"
                        />
                        <AdminActionButton
                          action="edit"
                          onClick={() => {
                            setEditBus(bus);
                            setModalOpen(true);
                          }}
                          title="Edit bus"
                        />
                        {bus.busStatus === 'inactive' ? (
                          <AdminActionButton
                            action="activate"
                            onClick={() => handleReactivateBus(bus._id)}
                            title="Reactivate bus"
                          />
                        ) : (
                          <AdminActionButton
                            action="deactivate"
                            onClick={() => handleDeactivateBus(bus._id)}
                            title="Deactivate bus"
                          />
                        )}
                        <AdminActionButton
                          action="delete"
                          onClick={() => handleRequestDelete(bus)}
                          title="Delete bus"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {buses.map((bus) => (
              <div key={bus._id} className="p-4 flex items-start gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-100">
                  {bus.busPhoto ? (
                    <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Bus className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{bus.busName}</p>
                    <StatusBadge status={bus.busStatus} size="xs" />
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {bus.busRegistrationNumber} · {bus.busCapacity} seats
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDetailBus(bus)}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      View
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditBus(bus);
                        setModalOpen(true);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300">·</span>
                    {bus.busStatus === 'inactive' ? (
                      <button
                        type="button"
                        onClick={() => handleReactivateBus(bus._id)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeactivateBus(bus._id)}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                      >
                        Deactivate
                      </button>
                    )}
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(bus)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table footer count */}
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
        </div>
      )}

      {/* ── Modal Form ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditBus(null);
        }}
        title={editBus ? 'Edit Bus' : 'Add New Bus'}
        subtitle={editBus ? `Updating vehicle details for ${editBus.busName}` : 'Enter the vehicle specifications below'}
        size="md"
      >
        <BusForm
          key={editBus?._id || 'new'}
          initial={editBus}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

      {/* ── Detail Drawer ── */}
      <BusDetailDrawer
        bus={detailBus}
        onClose={() => setDetailBus(null)}
        onEdit={() => {
          setEditBus(detailBus);
          setDetailBus(null);
          setModalOpen(true);
        }}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delBus)}
        onClose={() => setDelBus(null)}
        onConfirm={handleDelete}
        title="Delete Bus Vehicle?"
        description={`"${delBus?.busName} (${delBus?.busRegistrationNumber})" will be permanently removed from the university fleet.`}
        confirmLabel="Delete Bus"
        loading={deleting}
      />

      {/* ── Dependency Check Modal ── */}
      <DependencyModal
        isOpen={depModalOpen}
        onClose={() => {
          setDepModalOpen(false);
          setDependencyData(null);
        }}
        dependencyData={dependencyData}
        onDeactivate={() => handleDeactivateBus()}
        deactivating={deactivating}
        onConfirmDelete={() => {
          setDepModalOpen(false);
          setDelBus(dependencyData ? { _id: dependencyData.resourceId, busName: dependencyData.resourceName, busRegistrationNumber: '' } : null);
        }}
      />
    </div>
  );
};

export default BusesPage;
