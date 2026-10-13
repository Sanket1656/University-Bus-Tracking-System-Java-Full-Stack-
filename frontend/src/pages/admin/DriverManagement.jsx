import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Users, Trash2, Eye } from 'lucide-react';
import authApi from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';

const avatarGradients = ['from-amber-300 to-yellow-400','from-sky-300 to-cyan-400','from-rose-300 to-pink-400','from-violet-300 to-purple-400','from-teal-300 to-emerald-400'];
const avatarColor = (name = '') => avatarGradients[(name.charCodeAt(0) || 0) % avatarGradients.length];
const initials = (name = '') => name.split(' ').slice(0,2).map((w) => w[0]).join('').toUpperCase() || '?';

/* ── Driver Detail Drawer ─────────────────────────────────────────────────── */
const DriverDrawer = ({ driver, onClose }) => {
  if (!driver) return null;
  const name = driver.name || driver.username || '—';
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Driver Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-2xl font-bold text-white overflow-hidden`}>
              {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : initials(name)}
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{name}</p>
              <StatusBadge status={driver.role} size="xs" />
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Username',    driver.username],
              ['Email',       driver.email],
              ['Phone',       driver.phone],
              ['License ID',  driver.licenseId],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const DriverManagement = () => {
  const { addToast } = useToast();
  const [drivers,  setDrivers]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [viewDrv,  setViewDrv]  = useState(null);
  const [delDrv,   setDelDrv]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authApi.getAllDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch { addToast('Failed to load drivers', 'error'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(search ? drivers.filter((d) => `${d.name} ${d.username} ${d.email} ${d.phone}`.toLowerCase().includes(q)) : drivers);
  }, [drivers, search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteUser(delDrv._id);
      addToast('Driver deleted', 'success');
      setDelDrv(null);
      load();
    } catch { addToast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Driver Management" description="Manage registered drivers"
        action={
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            Add drivers via Register page (role: Driver)
          </p>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Total Drivers" value={drivers.length} icon={Users} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <StatCard title="Shown"         value={filtered.length} icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600" />
      </div>

      <div className="flex gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search drivers…" className="flex-1 max-w-sm" />
        <button onClick={load} className="px-3 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Refresh</button>
      </div>

      {loading ? <LoadingState rows={5} cols={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No drivers found" description="Register users with the Driver role." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Driver</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">License</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => {
                  const name = d.name || d.username || '—';
                  return (
                    <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0`}>
                            {d.photo ? <img src={d.photo} alt="" className="w-full h-full object-cover" /> : initials(name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">@{d.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-700">{d.email || '—'}</p>
                        <p className="text-xs text-gray-400">{d.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{d.licenseId || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={d.role} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewDrv(d)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDelDrv(d)}  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map((d) => {
              const name = d.name || d.username || '—';
              return (
                <div key={d._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0`}>
                    {d.photo ? <img src={d.photo} alt="" className="w-full h-full object-cover" /> : initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{d.email} · {d.phone || '—'}</p>
                    <StatusBadge status={d.role} size="xs" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => setViewDrv(d)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setDelDrv(d)}  className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewDrv && <DriverDrawer driver={viewDrv} onClose={() => setViewDrv(null)} />}
      <ConfirmDialog isOpen={Boolean(delDrv)} onClose={() => setDelDrv(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Driver?" description={`Delete driver "${delDrv?.name || delDrv?.username}"?`} />
    </div>
  );
};

export default DriverManagement;
