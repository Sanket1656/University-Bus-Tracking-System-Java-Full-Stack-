import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, Navigation, Compass } from 'lucide-react';
import stopApi from '../../api/stopApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import FormInput from '../../components/ui/FormInput';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { stopName: '', latitude: '', longtitude: '' };

const StopForm = ({ initial, onSubmit, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.stopName.trim()) e.stopName = 'Stop name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormInput
        label="Bus Stop Name"
        required
        value={form.stopName}
        onChange={(e) => set('stopName', e.target.value)}
        error={errors.stopName}
        placeholder="e.g. Science Block Gate / Katargam"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Latitude"
          type="number"
          step="any"
          value={form.latitude}
          onChange={(e) => set('latitude', e.target.value)}
          placeholder="e.g. 21.2514"
          hint="GPS Latitude coordinate"
        />
        <FormInput
          label="Longitude"
          type="number"
          step="any"
          value={form.longtitude}
          onChange={(e) => set('longtitude', e.target.value)}
          placeholder="e.g. 72.8637"
          hint="GPS Longitude coordinate"
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
          <span>{initial ? 'Save Changes' : 'Add Stop'}</span>
        </button>
      </div>
    </form>
  );
};

const StopsPage = () => {
  const { addToast } = useToast();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, located: 0 });
  const [modal, setModal] = useState(false);
  const [editStop, setEdit] = useState(null);
  const [delStop, setDel] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStops = useCallback(async (requestedPage = page, requestedSearch = search) => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await stopApi.getAll({ page: requestedPage, limit: 10, search: requestedSearch });
      const nextPagination = data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
      if (requestedPage > nextPagination.totalPages) {
        setPage(Math.max(1, nextPagination.totalPages));
        return;
      }
      setStops(data.data || []);
      setPagination(nextPagination);
      setSummary(data.summary || { total: nextPagination.total, located: 0 });
    } catch {
      setLoadError(true);
      addToast('Failed to load bus stops', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, page, search]);

  useEffect(() => {
    fetchStops(page, search);
  }, [fetchStops, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editStop) {
        await stopApi.update(editStop._id, form);
        addToast('Bus stop updated successfully', 'success');
      } else {
        await stopApi.create(form);
        addToast('Bus stop created successfully', 'success');
      }
      setModal(false);
      setEdit(null);
      fetchStops(page, search);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save stop', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = async (stop) => {
    try {
      const res = await stopApi.getDependencies(stop._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDel(stop);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDel(stop);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await stopApi.delete(delStop._id);
      addToast('Bus stop removed successfully', 'success');
      setDel(null);
      fetchStops(page, search);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDel(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to delete stop', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateStop = async (stopId) => {
    const targetId = stopId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await stopApi.deactivate(targetId);
      addToast('Bus stop deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchStops(page, search);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate stop', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateStop = async (stopId) => {
    try {
      await stopApi.reactivate(stopId);
      addToast('Bus stop reactivated successfully', 'success');
      fetchStops(page, search);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate stop', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Bus Stop Management"
        description="Manage transit stops, pickup waypoints, and GPS coordinates for route mapping"
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
            <span>Add Stop</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Stops"
          value={loading ? <SkeletonStatValue /> : summary.total}
          icon={MapPin}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Configured waypoints"
        />
        <StatCard
          title="GPS Located"
          value={loading ? <SkeletonStatValue /> : summary.located}
          icon={Navigation}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="With coordinates"
        />
        <StatCard
          title="Showing Records"
          value={loading ? <SkeletonStatValue /> : pagination.total}
          icon={Compass}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Matching active query"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search stops by name…"
        debounceMs={350}
        onRefresh={() => fetchStops(page, search)}
        refreshing={loading}
        extra={
          <span className="text-xs text-gray-500 font-medium">
            {stops.length} of {pagination.total} stops
          </span>
        }
      />

      {/* ── Stops Cards Grid ── */}
      {loading ? (
        <AdminSkeleton variant="stop" count={6} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchStops(page, search)} />
      ) : stops.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={MapPin}
            isSearch={Boolean(search)}
            title={search ? 'No bus stops match your query' : 'No bus stops created yet'}
            description={
              search
                ? 'Try searching with a different waypoint keyword.'
                : 'Add stops to build route timelines and student pickup locations.'
            }
            action={
              !search ? (
                <button
                  type="button"
                  onClick={() => setModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  + Add Stop
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stops.map((s) => {
            const hasCoords = Boolean(s.latitude || s.longtitude);
            return (
              <div
                key={s._id}
                className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between hover:border-gray-300/80 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-2xs">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className="text-sm font-bold text-gray-900 truncate"
                            title={s.stopName}
                          >
                            {s.stopName}
                          </h3>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'ACTIVE' || !s.status
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {s.status || 'ACTIVE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">Transit Waypoint</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {s.status === 'INACTIVE' ? (
                        <AdminActionButton
                          action="activate"
                          onClick={() => handleReactivateStop(s._id)}
                          title="Activate stop"
                        />
                      ) : (
                        <AdminActionButton
                          action="deactivate"
                          onClick={() => handleDeactivateStop(s._id)}
                          title="Deactivate stop"
                        />
                      )}
                      <AdminActionButton
                        action="edit"
                        onClick={() => {
                          setEdit(s);
                          setModal(true);
                        }}
                        title="Edit stop"
                      />
                      <AdminActionButton
                        action="delete"
                        onClick={() => handleRequestDelete(s)}
                        title="Delete stop"
                      />
                    </div>
                  </div>

                  {/* Coordinates pill */}
                  <div className="mt-3.5 pt-3 border-t border-gray-100">
                    {hasCoords ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-gray-50/70 rounded-lg p-2 border border-gray-100">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-sans">Lat</span>
                          <span className="text-gray-700 font-semibold truncate block">{s.latitude ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-sans">Long</span>
                          <span className="text-gray-700 font-semibold truncate block">
                            {s.longtitude ?? s.longitude ?? '—'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No GPS coordinates set</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* ── Modal Form ── */}
      <Modal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          setEdit(null);
        }}
        title={editStop ? 'Edit Bus Stop' : 'Add Bus Stop'}
        subtitle={
          editStop
            ? `Updating details for "${editStop.stopName}"`
            : 'Enter waypoint name and geographic coordinates'
        }
        size="sm"
      >
        <StopForm
          key={editStop?._id || 'new'}
          initial={editStop}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delStop)}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
        title="Delete Bus Stop?"
        description={`"${delStop?.stopName}" will be removed. Existing routes using this stop may be impacted.`}
        confirmLabel="Delete Stop"
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
        onDeactivate={handleDeactivateStop}
        loading={deactivating}
      />
    </div>
  );
};

export default StopsPage;
