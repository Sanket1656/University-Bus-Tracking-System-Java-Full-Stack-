import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Bus, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import busApi from '../../api/busApi';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import SelectInput from '../../components/ui/SelectInput';
import { resolveMediaUrl } from '../../utils/mediaUtils';

/* ── Bus Form Modal ─────────────────────────────────────────────────────────── */
const BusForm = ({ bus, onClose, onSaved }) => {
  const { addToast } = useToast();
  const isEdit = Boolean(bus);
  const [form, setForm] = useState({
    busName: bus?.busName || '',
    busNumber: bus?.busNumber || '',
    busRegistrationNumber: bus?.busRegistrationNumber || '',
    busType: bus?.busType || 'Non-Ac',
    busCapacity: bus?.busCapacity || '',
    busStatus: bus?.busStatus || 'active',
    busPhoto: null,
  });
  const [preview, setPreview] = useState(bus?.busPhoto || null);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.busName.trim())                 e.busName = 'Required';
    if (!form.busNumber.trim())               e.busNumber = 'Required';
    if (!form.busRegistrationNumber.trim())   e.busRegistrationNumber = 'Required';
    if (!form.busCapacity || form.busCapacity < 1) e.busCapacity = 'Must be ≥ 1';
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

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
      if (isEdit) {
        // backend has no PUT bus route by default; keep same create endpoint
        await busApi.create(fd);
      } else {
        await busApi.create(fd);
      }
      addToast(isEdit ? 'Bus updated!' : 'Bus added!', 'success');
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save bus', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Photo upload */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Bus Photo</p>
        <label className="block cursor-pointer">
          <div className={`h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${preview ? 'border-transparent' : 'border-gray-200 hover:border-indigo-400'}`}>
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
              : <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Bus className="w-8 h-8" />
                  <p className="text-xs">Click to upload photo</p>
                </div>
            }
          </div>
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput label="Bus Name" required value={form.busName} onChange={(e) => set('busName', e.target.value)} error={errors.busName} placeholder="e.g. Volvo B8R" />
        <FormInput label="Bus Number" required value={form.busNumber} onChange={(e) => set('busNumber', e.target.value)} error={errors.busNumber} placeholder="e.g. BUS-001" />
        <FormInput label="Registration Number" required value={form.busRegistrationNumber} onChange={(e) => set('busRegistrationNumber', e.target.value)} error={errors.busRegistrationNumber} placeholder="e.g. GJ-05-AB-1234" />
        <FormInput label="Capacity" required type="number" min="1" value={form.busCapacity} onChange={(e) => set('busCapacity', e.target.value)} error={errors.busCapacity} placeholder="52" />
        <SelectInput label="Bus Type" value={form.busType} onChange={(e) => set('busType', e.target.value)}
          options={[{ value: 'Non-Ac', label: 'Non-AC' }, { value: 'Ac', label: 'AC' }]} />
        <SelectInput label="Status" value={form.busStatus} onChange={(e) => set('busStatus', e.target.value)}
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'maintenance', label: 'Maintenance' }]} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving && <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {isEdit ? 'Update Bus' : 'Add Bus'}
        </button>
      </div>
    </form>
  );
};

/* ── Bus Details Drawer ───────────────────────────────────────────────────── */
const BusDrawer = ({ bus, onClose, onEdit }) => {
  if (!bus) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Bus Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="w-full h-40 bg-indigo-50 rounded-xl overflow-hidden flex items-center justify-center">
            {bus.busPhoto
              ? <img src={resolveMediaUrl(bus.busPhoto)} alt={bus.busName} className="w-full h-full object-cover" />
              : <Bus className="w-16 h-16 text-indigo-200" />
            }
          </div>
          <div className="space-y-3">
            {[
              ['Bus Name', bus.busName],
              ['Bus Number', bus.busNumber],
              ['Registration', bus.busRegistrationNumber],
              ['Type', bus.busType],
              ['Capacity', `${bus.busCapacity} seats`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900">{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={bus.busStatus} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button onClick={() => { onEdit(bus); onClose(); }}
            className="flex-1 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            Edit Bus
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const BusManagement = () => {
  const { addToast } = useToast();
  const [buses,    setBuses]    = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editBus,  setEditBus]  = useState(null);
  const [viewBus,  setViewBus]  = useState(null);
  const [delBus,   setDelBus]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await busApi.getAll();
      setBuses(data?.data || []);
    } catch { addToast('Failed to load buses', 'error'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = buses;
    if (search)         f = f.filter((b) => `${b.busName} ${b.busNumber} ${b.busRegistrationNumber}`.toLowerCase().includes(search.toLowerCase()));
    if (statusF !== 'all') f = f.filter((b) => b.busStatus === statusF);
    setFiltered(f);
  }, [buses, search, statusF]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await busApi.delete(delBus._id);
      addToast('Bus deleted', 'success');
      setDelBus(null);
      load();
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: buses.length,
    active: buses.filter((b) => b.busStatus === 'active').length,
    inactive: buses.filter((b) => b.busStatus === 'inactive').length,
    maintenance: buses.filter((b) => b.busStatus === 'maintenance').length,
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Bus Management"
        description="Manage your university fleet"
        action={
          <button onClick={() => { setEditBus(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Bus
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total"       value={stats.total}       icon={Bus}    iconBg="bg-blue-100"   iconColor="text-blue-600" />
        <StatCard title="Active"      value={stats.active}      icon={Bus}    iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard title="Inactive"    value={stats.inactive}    icon={Bus}    iconBg="bg-gray-100"   iconColor="text-gray-500" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={Bus}    iconBg="bg-amber-100"  iconColor="text-amber-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search buses…" className="flex-1 max-w-sm" />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button onClick={load} className="px-3 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Refresh</button>
      </div>

      {/* Table */}
      {loading ? <LoadingState rows={6} cols={5} /> : filtered.length === 0 ? (
        <EmptyState icon={Bus} title="No buses found" description="Add your first bus to get started."
          action={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">Add Bus</button>} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Bus</th>
                  <th className="px-5 py-3 text-left">Registration</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Capacity</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((bus) => (
                  <tr key={bus._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {bus.busPhoto ? <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" /> : <Bus className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{bus.busName}</p>
                          <p className="text-xs text-gray-400">{bus.busNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{bus.busRegistrationNumber}</td>
                    <td className="px-5 py-3 text-gray-600">{bus.busType}</td>
                    <td className="px-5 py-3 text-gray-600">{bus.busCapacity}</td>
                    <td className="px-5 py-3"><StatusBadge status={bus.busStatus} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewBus(bus)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setEditBus(bus); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDelBus(bus)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {filtered.map((bus) => (
              <div key={bus._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {bus.busPhoto ? <img src={resolveMediaUrl(bus.busPhoto)} alt="" className="w-full h-full object-cover" /> : <Bus className="w-6 h-6 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{bus.busName}</p>
                  <p className="text-xs text-gray-400 truncate">{bus.busRegistrationNumber} · {bus.busCapacity} seats</p>
                  <StatusBadge status={bus.busStatus} size="xs" className="mt-1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setViewBus(bus)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => { setEditBus(bus); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDelBus(bus)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditBus(null); }}
        title={editBus ? 'Edit Bus' : 'Add New Bus'} size="lg">
        <BusForm bus={editBus} onClose={() => { setShowForm(false); setEditBus(null); }} onSaved={() => { setShowForm(false); setEditBus(null); load(); }} />
      </Modal>

      {/* Details Drawer */}
      {viewBus && <BusDrawer bus={viewBus} onClose={() => setViewBus(null)} onEdit={(b) => { setEditBus(b); setShowForm(true); }} />}

      {/* Delete confirm */}
      <ConfirmDialog isOpen={Boolean(delBus)} onClose={() => setDelBus(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Bus?" description={`Delete "${delBus?.busName}"? This cannot be undone.`} />
    </div>
  );
};

export default BusManagement;
