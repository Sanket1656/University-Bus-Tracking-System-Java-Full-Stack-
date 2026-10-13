import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Link2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Bus,
  Users,
  Route as RouteIcon,
  X,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import assignmentApi from '../../api/assignmentApi';
import busApi from '../../api/busApi';
import authApi from '../../api/authApi';
import routeApi from '../../api/routeApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import RouteTimeline from '../../components/ui/RouteTimeline';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import SelectInput from '../../components/ui/SelectInput';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const getInitials = (n = '') =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DR';

/* ── Assignment Detail Drawer ─────────────────────────────────────────────── */
const AssignmentDetail = ({ assignment: a, onClose, onEdit }) => {
  if (!a) return null;
  const bus = a.bus || {};
  const driver = a.driver || {};
  const route = a.route || {};
  const name = driver.name || driver.username || '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{bus.busName || 'Assignment Details'}</h2>
              <StatusBadge status={a.status || 'Active'} size="xs" />
            </div>
            <p className="text-purple-200 text-xs mt-0.5">{route.routeName || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              title="Edit assignment"
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
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {/* Bus section */}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-purple-700 text-[9px] font-bold">
                01
              </span>
              <span>Vehicle Fleet</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                {bus.busPhoto ? (
                  <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Bus className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{bus.busName || '—'}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {bus.busRegistrationNumber || '—'} · {bus.busCapacity || 0} seats
                </p>
              </div>
            </div>
          </div>

          {/* Driver section */}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-purple-700 text-[9px] font-bold">
                02
              </span>
              <span>Designated Operator</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0 shadow-2xs">
                {driver.photo ? (
                  <img src={driver.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(name)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {driver.phone || driver.email || 'Verified Transit Driver'}
                </p>
              </div>
            </div>
          </div>

          {/* Route section */}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-purple-700 text-[9px] font-bold">
                03
              </span>
              <span>Assigned Route Corridor</span>
            </p>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-gray-900">{route.routeName || '—'}</p>
              <span className="font-mono text-xs bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded font-bold">
                {route.routeCode || ''}
              </span>
            </div>
            <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-3.5">
              <RouteTimeline stops={route.stops || []} compact />
            </div>
          </div>

          {/* Metadata */}
          <div className="p-5 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-purple-700 text-[9px] font-bold">
                04
              </span>
              <span>Assignment State</span>
            </p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Operation Status</span>
              <StatusBadge status={a.status || 'Active'} />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Created On</span>
              <span className="text-gray-900 font-semibold">
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Assignment Form ─────────────────────────────────────────────────────── */
const AssignmentForm = ({ initial, buses, drivers, routes, onSubmit, loading }) => {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    bus: initial?.bus?._id || initial?.bus || '',
    driver: initial?.driver?._id || initial?.driver || '',
    route: initial?.route?._id || initial?.route || '',
    status: initial?.status || 'Active',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.bus) e.bus = 'Please select a bus vehicle';
    if (!form.driver) e.driver = 'Please select a driver';
    if (!form.route) e.route = 'Please select a route corridor';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const selBus = buses.find((b) => b._id === form.bus);
  const selDriver = drivers.find((d) => d._id === form.driver);
  const selRoute = routes.find((r) => r._id === form.route);

  return (
    <form onSubmit={submit} className="space-y-4">
      {isEdit && (
        <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl px-4 py-2.5 text-xs text-purple-800 font-medium">
          Updating existing operational assignment #{initial._id?.slice(-8).toUpperCase()}
        </div>
      )}

      {/* Select Bus */}
      <SelectInput
        label="Bus Vehicle"
        required
        error={errors.bus}
        value={form.bus}
        onChange={(e) => set('bus', e.target.value)}
        placeholder="Select a bus…"
        options={buses.map((b) => ({
          value: b._id,
          label: `${b.busName} — ${b.busRegistrationNumber} (${b.busCapacity || 0} seats)`,
        }))}
      />
      {selBus && (
        <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-200/80 rounded-xl px-4 py-2.5 -mt-2">
          <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {selBus.busPhoto ? (
              <img src={resolveMediaUrl(selBus.busPhoto)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Bus className="w-4 h-4" />
            )}
          </div>
          <div className="text-xs text-gray-700">
            <strong>{selBus.busName}</strong> · {selBus.busRegistrationNumber} · {selBus.busCapacity} seats
          </div>
        </div>
      )}

      {/* Select Driver */}
      <SelectInput
        label="Assigned Driver"
        required
        error={errors.driver}
        value={form.driver}
        onChange={(e) => set('driver', e.target.value)}
        placeholder="Select a verified driver…"
        options={drivers.map((d) => ({
          value: d._id,
          label: `${d.name || d.username}${d.licenseId ? ` (${d.licenseId})` : ''}`,
        }))}
      />
      {selDriver && (
        <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-200/80 rounded-xl px-4 py-2.5 -mt-2">
          <div className="w-8 h-8 bg-purple-50 text-purple-700 rounded-lg flex items-center justify-center text-xs font-bold">
            {getInitials(selDriver.name || selDriver.username)}
          </div>
          <div className="text-xs text-gray-700">
            <strong>{selDriver.name || selDriver.username}</strong>
            {selDriver.licenseId ? ` · License: ${selDriver.licenseId}` : ''}
          </div>
        </div>
      )}

      {/* Select Route */}
      <SelectInput
        label="Transit Route Corridor"
        required
        error={errors.route}
        value={form.route}
        onChange={(e) => set('route', e.target.value)}
        placeholder="Select a configured route…"
        options={routes.map((r) => ({
          value: r._id,
          label: `${r.routeName} (${r.routeCode}) — ${r.stops?.length || 0} stops`,
        }))}
      />
      {selRoute && (
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl px-4 py-2.5 -mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="font-bold">{selRoute.routeName}</span>
            <span className="font-mono bg-purple-50 text-purple-700 border border-purple-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {selRoute.routeCode}
            </span>
            <span className="text-gray-400">· {selRoute.stops?.length || 0} stops</span>
          </div>
        </div>
      )}

      {isEdit && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Operation Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Active', 'Inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  form.status === s
                    ? s === 'Active'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-400 bg-gray-100 text-gray-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {form.status === s && '✓ '}
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors shadow-xs"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          )}
          <span>{isEdit ? 'Save Changes' : 'Create Assignment'}</span>
        </button>
      </div>
    </form>
  );
};

/* ── Assignment Card ─────────────────────────────────────────────────────── */
const AssignmentCard = ({ a, onView, onEdit, onDelete, onDeactivate, onActivate }) => {
  const bus = a.bus || {};
  const driver = a.driver || {};
  const route = a.route || {};
  const sorted = [...(route.stops || [])].sort((x, y) => x.order - y.order);
  const start = sorted[0]?.stop?.stopName ?? '—';
  const end = sorted[sorted.length - 1]?.stop?.stopName ?? '—';
  const dName = driver.name || driver.username || 'Unassigned';

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs hover:border-gray-300/80 transition-all flex flex-col justify-between h-full overflow-hidden">
      {/* Top: Bus info & Status */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
            {bus.busPhoto ? (
              <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Bus className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
              {bus.busName || 'Bus'}
            </h3>
            <span className="inline-block text-[11px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded mt-0.5">
              {bus.busRegistrationNumber || 'GJ-00-XX'}
            </span>
          </div>
        </div>
        <StatusBadge status={a.status || 'Active'} size="xs" />
      </div>

      {/* Middle: Driver & Route */}
      <div className="p-4 sm:p-5 space-y-3.5 flex-1">
        {/* Driver */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {driver.photo ? (
              <img src={driver.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(dName)
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Driver</span>
            <span className="text-xs font-bold text-gray-800 truncate block">{dName}</span>
          </div>
        </div>

        {/* Route Card summary */}
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-gray-900 truncate">
              {route.routeName || 'Unassigned Route'}
            </span>
            <span className="font-mono text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 px-1.5 py-0.5 rounded flex-shrink-0">
              {route.routeCode || 'RT'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-emerald-800 font-semibold truncate text-[11px]">{start}</span>
            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            <span className="text-rose-800 font-semibold truncate text-[11px]">{end}</span>
            <span className="text-gray-400 text-[10px] ml-auto flex-shrink-0">
              {route.stops?.length || 0} stops
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Date & Actions */}
      <div className="px-4 sm:px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
          <Calendar className="w-3 h-3" />
          {a.createdAt
            ? new Date(a.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
        <div className="flex items-center gap-1">
          {a.status?.toLowerCase() === 'inactive' ? (
            <AdminActionButton
              action="activate"
              onClick={onActivate}
              title="Activate assignment"
            />
          ) : (
            <AdminActionButton
              action="deactivate"
              onClick={onDeactivate}
              title="Deactivate assignment"
            />
          )}
          <AdminActionButton action="view" onClick={onView} title="View assignment" />
          <AdminActionButton action="edit" onClick={onEdit} title="Edit assignment" />
          <AdminActionButton action="delete" onClick={onDelete} title="Delete assignment" />
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const AssignmentsPage = () => {
  const { addToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [modal, setModal] = useState(false);
  const [editA, setEdit] = useState(null);
  const [detail, setDetail] = useState(null);
  const [delA, setDel] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async (requestedPage = page, requestedSearch = search, requestedStatus = statusFilter) => {
    setLoading(true);
    setLoadError(false);
    try {
      const [aRes, bRes, dRes, rRes] = await Promise.all([
        assignmentApi.getAll({ page: requestedPage, limit: 10, search: requestedSearch, status: requestedStatus }),
        busApi.getAll({ limit: 200 }),
        authApi.getAllDrivers({ limit: 200 }),
        routeApi.getAll({ limit: 200 }),
      ]);
      const nextPagination = aRes.data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
      if (requestedPage > nextPagination.totalPages) {
        setPage(Math.max(1, nextPagination.totalPages));
        return;
      }
      setAssignments(aRes.data.data || []);
      setPagination(nextPagination);
      setSummary(aRes.data.summary || { total: nextPagination.total, active: 0, inactive: 0 });
      setBuses(bRes.data.data || []);
      setDrivers(Array.isArray(dRes.data.data) ? dRes.data.data : []);
      setRoutes(rRes.data.data || []);
    } catch {
      setLoadError(true);
      addToast('Failed to load fleet assignment data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, page, search, statusFilter]);

  useEffect(() => {
    fetchAll(page, search, statusFilter);
  }, [fetchAll, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editA) {
        await assignmentApi.update(editA._id, form);
        addToast('Assignment updated successfully', 'success');
      } else {
        await assignmentApi.create(form);
        addToast('Assignment created successfully', 'success');
      }
      setModal(false);
      setEdit(null);
      fetchAll(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save assignment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = async (assignment) => {
    try {
      const res = await assignmentApi.getDependencies(assignment._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDel(assignment);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDel(assignment);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await assignmentApi.delete(delA._id);
      addToast('Assignment deleted successfully', 'success');
      setDel(null);
      fetchAll(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDel(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Delete failed', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateAssignment = async (assignmentId) => {
    const targetId = assignmentId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await assignmentApi.deactivate(targetId);
      addToast('Assignment deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchAll(page, search, statusFilter);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate assignment', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateAssignment = async (assignmentId) => {
    try {
      await assignmentApi.reactivate(assignmentId);
      addToast('Assignment reactivated successfully', 'success');
      fetchAll(page, search, statusFilter);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate assignment', 'error');
    }
  };

  const stats = useMemo(() => {
    return {
      total: summary.total,
      active: summary.active,
      inactive: summary.inactive,
    };
  }, [summary]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Fleet Assignments"
        description="Pair active buses, certified drivers, and routes into daily operational transit schedules"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Assignments"
          value={loading ? <SkeletonStatValue /> : stats.total}
          icon={Link2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Configured operational links"
        />
        <StatCard
          title="Active Schedules"
          value={loading ? <SkeletonStatValue /> : stats.active}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Live in transit system"
        />
        <StatCard
          title="Inactive Schedules"
          value={loading ? <SkeletonStatValue /> : stats.inactive}
          icon={Link2}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          sub="Paused operations"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by bus, driver or route corridor…"
        debounceMs={350}
        onRefresh={() => fetchAll(page, search, statusFilter)}
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        }
        extra={
          <span className="text-xs text-gray-500 font-medium">
            {assignments.length} of {pagination.total} assignments
          </span>
        }
      />

      {/* ── Cards Grid ── */}
      {loading ? (
        <AdminSkeleton variant="assignment" count={6} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchAll(page, search, statusFilter)} />
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={Link2}
            isSearch={Boolean(search || statusFilter !== 'all')}
            title={
              search || statusFilter !== 'all'
                ? 'No assignments match your query'
                : 'No assignments created yet'
            }
            description={
              search || statusFilter !== 'all'
                ? 'Try clearing the search or status filter.'
                : 'Create your first assignment to link a vehicle, driver, and transit route corridor.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <button
                  type="button"
                  onClick={() => setModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  + New Assignment
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((a) => (
            <AssignmentCard
              key={a._id}
              a={a}
              onView={() => setDetail(a)}
              onEdit={() => {
                setEdit(a);
                setModal(true);
              }}
              onDelete={() => handleRequestDelete(a)}
              onDeactivate={() => handleDeactivateAssignment(a._id)}
              onActivate={() => handleReactivateAssignment(a._id)}
            />
          ))}
        </div>
      )}

      {/* ── Modal Form ── */}
      <Modal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          setEdit(null);
        }}
        title={editA ? 'Edit Assignment' : 'New Assignment'}
        subtitle={
          editA
            ? `Updating fleet assignment #${editA._id?.slice(-8).toUpperCase()}`
            : 'Pair an available bus, certified driver, and transit route'
        }
        size="md"
      >
        <AssignmentForm
          key={editA?._id || 'new'}
          initial={editA}
          buses={buses}
          drivers={drivers}
          routes={routes}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

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

      {/* ── Detail Drawer ── */}
      <AssignmentDetail
        assignment={detail}
        onClose={() => setDetail(null)}
        onEdit={() => {
          setEdit(detail);
          setDetail(null);
          setModal(true);
        }}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delA)}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
        title="Delete Fleet Assignment?"
        description="This will unbind the bus, driver and route pairing. Linked schedules will need reassignment."
        confirmLabel="Delete Assignment"
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
        onDeactivate={handleDeactivateAssignment}
        loading={deactivating}
      />
    </div>
  );
};

export default AssignmentsPage;
