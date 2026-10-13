import React, { useEffect, useState, useCallback } from 'react';
import { Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import stopApi from '../../api/stopApi';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';

/* ── Stop Form ─────────────────────────────────────────────────────────────── */
const StopForm = ({ stop, onClose, onSaved }) => {
  const { addToast } = useToast();
  const isEdit = Boolean(stop);
  const [form, setForm] = useState({
    stopName:   stop?.stopName   || '',
    latitude:   stop?.latitude   ?? '',
    longtitude: stop?.longtitude ?? '',      // note backend typo: longtitude
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.stopName.trim()) e.stopName = 'Required';
    if (form.latitude === '' || isNaN(Number(form.latitude))) e.latitude = 'Valid number required';
    if (form.longtitude === '' || isNaN(Number(form.longtitude))) e.longtitude = 'Valid number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { stopName: form.stopName.trim(), latitude: Number(form.latitude), longtitude: Number(form.longtitude) };
      if (isEdit) await stopApi.update(stop._id, payload);
      else        await stopApi.create(payload);
      addToast(isEdit ? 'Stop updated!' : 'Stop created!', 'success');
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save stop', 'error');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormInput label="Stop Name" required value={form.stopName} onChange={(e) => set('stopName', e.target.value)} error={errors.stopName} placeholder="e.g. Valinath Chowk" />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Latitude"  required type="number" step="any" value={form.latitude}   onChange={(e) => set('latitude',   e.target.value)} error={errors.latitude}   placeholder="21.1702" />
        <FormInput label="Longitude" required type="number" step="any" value={form.longtitude} onChange={(e) => set('longtitude', e.target.value)} error={errors.longtitude} placeholder="72.8311" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          {saving && <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {isEdit ? 'Update Stop' : 'Add Stop'}
        </button>
      </div>
    </form>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const StopManagement = () => {
  const { addToast } = useToast();
  const [stops,    setStops]    = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStop, setEditStop] = useState(null);
  const [delStop,  setDelStop]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await stopApi.getAll();
      setStops(data?.data || []);
    } catch { addToast('Failed to load stops', 'error'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setFiltered(search ? stops.filter((s) => s.stopName?.toLowerCase().includes(search.toLowerCase())) : stops);
  }, [stops, search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await stopApi.delete(delStop._id);
      addToast('Stop deleted', 'success');
      setDelStop(null); load();
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Bus Stop Management" description="Manage stop locations and coordinates"
        action={
          <button onClick={() => { setEditStop(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Stop
          </button>
        }
      />

      <StatCard title="Total Stops" value={stops.length} icon={MapPin} iconBg="bg-blue-100" iconColor="text-blue-600" />

      <div className="flex gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search stops…" className="flex-1 max-w-sm" />
        <button onClick={load} className="px-3 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Refresh</button>
      </div>

      {loading ? <LoadingState rows={6} cols={3} /> : filtered.length === 0 ? (
        <EmptyState icon={MapPin} title="No stops found" description="Add your first bus stop."
          action={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">Add Stop</button>} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Stop Name</th>
                  <th className="px-5 py-3 text-left">Latitude</th>
                  <th className="px-5 py-3 text-left">Longitude</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-medium text-gray-900">{s.stopName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{s.latitude ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{s.longtitude ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setEditStop(s); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDelStop(s)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{s.stopName}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.latitude}, {s.longtitude}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditStop(s); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDelStop(s)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditStop(null); }}
        title={editStop ? 'Edit Stop' : 'Add Bus Stop'} size="sm">
        <StopForm stop={editStop} onClose={() => { setShowForm(false); setEditStop(null); }}
          onSaved={() => { setShowForm(false); setEditStop(null); load(); }} />
      </Modal>

      <ConfirmDialog isOpen={Boolean(delStop)} onClose={() => setDelStop(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Stop?" description={`Delete "${delStop?.stopName}"?`} />
    </div>
  );
};

export default StopManagement;
