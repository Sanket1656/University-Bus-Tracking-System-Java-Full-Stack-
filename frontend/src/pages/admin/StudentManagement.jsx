import React, { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Trash2, Eye } from 'lucide-react';
import authApi from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const imgUrl = resolveMediaUrl;

const initials = (name = '') => name.split(' ').slice(0,2).map((w)=>w[0]).join('').toUpperCase() || '?';
const avatarGradients = ['from-amber-300 to-yellow-400','from-sky-300 to-cyan-400','from-rose-300 to-pink-400','from-violet-300 to-purple-400','from-teal-300 to-emerald-400'];
const avatarColor = (name='') => avatarGradients[(name.charCodeAt(0)||0) % avatarGradients.length];

const StudentDrawer = ({ student, onClose }) => {
  if (!student) return null;
  const name = student.name || student.username || '—';
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-sm bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-sm`}>
              {student.photo ? (
                <img src={imgUrl(student.photo)} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials(name)
              )}
            </div>
            <p className="text-base font-bold text-gray-900">{name}</p>
            <StatusBadge status={student.role} size="xs" />
          </div>
          <div className="space-y-3">
            {[['Username', student.username], ['Email', student.email], ['Phone', student.phone], ['Branch', student.branch], ['Enrollment', student.enrollmentNumber]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-900">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentManagement = () => {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [branchF,  setBranchF]  = useState('all');
  const [viewStu,  setViewStu]  = useState(null);
  const [delStu,   setDelStu]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authApi.getAllStudents({
        page: 1,
        limit: 1000,
      });

      const nextStudents = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setStudents(nextStudents);
    } catch {
      addToast('Failed to load students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const branches = [...new Set(students.map((s) => s.branch).filter(Boolean))];

  useEffect(() => {
    let f = students;
    if (search)           f = f.filter((s) => `${s.name} ${s.username} ${s.email} ${s.branch} ${s.enrollmentNumber}`.toLowerCase().includes(search.toLowerCase()));
    if (branchF !== 'all') f = f.filter((s) => s.branch === branchF);
    setFiltered(f);
  }, [students, search, branchF]);

  const handleDelete = async () => {
    if (!delStu?._id) return;

    setDeleting(true);
    try {
      await authApi.deleteUser(delStu._id);
      addToast('Student deleted', 'success');
      setDelStu(null);
      await load();
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Student Management" description="Manage enrolled students" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={GraduationCap} iconBg="bg-pink-100" iconColor="text-pink-600" />
        <StatCard title="Branches" value={branches.length}       icon={GraduationCap} iconBg="bg-violet-100" iconColor="text-violet-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search students…" className="flex-1 max-w-sm" />
        {branches.length > 0 && (
          <select value={branchF} onChange={(e) => setBranchF(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <button onClick={load} className="px-3 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Refresh</button>
      </div>

      {loading ? <LoadingState rows={6} cols={5} /> : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" description="Students register via the student portal." />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Branch</th>
                  <th className="px-5 py-3 text-left">Enrollment</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const name = s.name || s.username || '—';
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-xs font-bold text-white overflow-hidden`}>
                            {s.photo ? (
                              <img src={imgUrl(s.photo)} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              initials(name)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">@{s.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-700">{s.email || '—'}</p>
                        <p className="text-xs text-gray-400">{s.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.branch || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{s.enrollmentNumber || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewStu(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDelStu(s)}  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden grid gap-3">
            {filtered.map((s) => {
              const name = s.name || s.username || '—';
              return (
                <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden`}>
                    {s.photo ? (
                      <img src={imgUrl(s.photo)} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      initials(name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.branch || '—'} · {s.email}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => setViewStu(s)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setDelStu(s)}  className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewStu && <StudentDrawer student={viewStu} onClose={() => setViewStu(null)} />}
      <ConfirmDialog isOpen={Boolean(delStu)} onClose={() => setDelStu(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Student?" description={`Delete "${delStu?.name || delStu?.username}"?`} />
    </div>
  );
};

export default StudentManagement;
