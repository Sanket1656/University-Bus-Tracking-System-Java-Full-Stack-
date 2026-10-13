import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GraduationCap, Trash2, Eye, Phone, Mail, BookOpen, UserCheck, X } from 'lucide-react';
import authApi from '../../api/authApi';
import studentApi from '../../api/studentApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import AdminLoadError from '../../components/ui/AdminLoadError';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DependencyModal from '../../components/ui/DependencyModal';
import AdminFilterBar from '../../components/ui/AdminFilterBar';
import AdminActionButton from '../../components/ui/AdminActionButton';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const imgUrl = resolveMediaUrl;

const getInitials = (n = '') =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'ST';

const StudentAvatar = ({ photo, name, className = 'w-full h-full object-cover' }) => {
  const [error, setError] = useState(false);
  const src = imgUrl(photo);
  if (src && !error) {
    return <img src={src} alt={name || 'Student'} className={className} onError={() => setError(true)} />;
  }
  return <span>{getInitials(name)}</span>;
};

const StudentDetailDrawer = ({ student, onClose }) => {
  if (!student) return null;
  const name = student.name || student.username || 'Student';

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0 overflow-hidden shadow-xs">
              <StudentAvatar photo={student.photo} name={name} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-purple-200 truncate">{student.branch || 'Student User'}</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                  Student
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
              ['Username', student.username],
              ['Full Legal Name', student.name],
              ['Enrollment Number', student.enrollmentNumber],
              ['Academic Branch', student.branch],
              ['Email Address', student.email],
              ['Contact Phone', student.phone],
              ['Account Role', 'Student'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{k}</span>
                <span className="text-sm font-bold text-gray-900">{v && v !== 'N/A' ? v : '—'}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-800">
            <p className="font-semibold mb-1">Transit Enrollment Status</p>
            <p className="leading-relaxed text-purple-700">
              Eligible for campus transport passes and live route tracking. Requests for transport can be verified in Transport Management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentsPage = () => {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0 });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [detail, setDetail] = useState(null);
  const [delStu, setDelStu] = useState(null);
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [dependencyData, setDependencyData] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async (requestedPage = page, requestedSearch = search, requestedBranch = branch) => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await authApi.getAllStudents({
        page: requestedPage,
        limit: 10,
        search: requestedSearch,
        branch: requestedBranch,
      });
      const nextPagination = data.pagination || { page: requestedPage, limit: 10, total: 0, totalPages: 1 };
      if (requestedPage > nextPagination.totalPages) {
        setPage(Math.max(1, nextPagination.totalPages));
        return;
      }
      setStudents(Array.isArray(data.data) ? data.data : []);
      setPagination(nextPagination);
      setSummary(data.summary || { total: nextPagination.total });
      setAvailableBranches(Array.isArray(data.filters?.branches) ? data.filters.branches : []);
    } catch {
      setLoadError(true);
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, page, search, branch]);

  useEffect(() => {
    fetchStudents(page, search, branch);
  }, [fetchStudents, page, search, branch]);

  useEffect(() => {
    setPage(1);
  }, [search, branch]);

  const branches = useMemo(() => {
    if (availableBranches.length) return availableBranches;
    return [...new Set(students.map((s) => s.branch).filter(Boolean))].sort();
  }, [students, availableBranches]);

  const handleRequestDelete = async (student) => {
    try {
      const res = await studentApi.getDependencies(student._id);
      setDependencyData(res.data);
      if (res.data?.canDelete) {
        setDelStu(student);
      } else {
        setDepModalOpen(true);
      }
    } catch {
      setDelStu(student);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteUser(delStu._id);
      addToast('Student account removed', 'success');
      setDelStu(null);
      fetchStudents(page, search, branch);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDelStu(null);
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to remove student', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateStudent = async (studentId) => {
    const targetId = studentId || dependencyData?.resourceId;
    if (!targetId) return;
    setDeactivating(true);
    try {
      await studentApi.deactivate(targetId);
      addToast('Student deactivated successfully', 'success');
      setDepModalOpen(false);
      setDependencyData(null);
      fetchStudents(page, search, branch);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.dependencies) {
        setDependencyData(err.response.data);
        setDepModalOpen(true);
      } else {
        addToast(err.response?.data?.message || 'Failed to deactivate student', 'error');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateStudent = async (studentId) => {
    try {
      await studentApi.reactivate(studentId);
      addToast('Student reactivated successfully', 'success');
      fetchStudents(page, search, branch);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate student', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Student Management"
        description="View and manage enrolled student transit users, academic branches, and enrollment numbers"
        breadcrumb="Admin"
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Students"
          value={loading ? <SkeletonStatValue /> : summary.total}
          icon={GraduationCap}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Enrolled university transit users"
        />
        <StatCard
          title="Showing Records"
          value={loading ? <SkeletonStatValue /> : pagination.total}
          icon={UserCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="After active search and filters"
        />
        <StatCard
          title="Academic Branches"
          value={loading ? <SkeletonStatValue /> : branches.length}
          icon={BookOpen}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Represented departments"
        />
      </div>

      {/* ── Filter Bar ── */}
      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search students by name, email, branch, enrollment…"
        debounceMs={350}
        onRefresh={() => fetchStudents(page, search, branch)}
        refreshing={loading}
        filters={
          <select
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3.5 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            <option value="all">All Academic Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        }
        extra={
          <span className="text-xs text-gray-500 font-medium">
            {students.length} of {pagination.total} students
          </span>
        }
      />

      {/* ── Data Table ── */}
      {loading ? (
        <AdminSkeleton variant="table" rows={6} columns={6} />
      ) : loadError ? (
        <AdminLoadError onRetry={() => fetchStudents(page, search, branch)} />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={GraduationCap}
            isSearch={Boolean(search || branch !== 'all')}
            title={search || branch !== 'all' ? 'No students match your query' : 'No students registered'}
            description={
              search || branch !== 'all'
                ? 'Try clearing the search or branch filter to see other student records.'
                : 'Students registered through the student registration portal will appear here.'
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
                    Student
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Contact Phone
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Academic Branch
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Enrollment No.
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden shadow-2xs">
                          <StudentAvatar photo={s.photo} name={s.name || s.username} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {s.name || s.username}
                            </p>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                s.status?.toLowerCase() === 'inactive'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {s.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">@{s.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[200px] truncate" title={s.email}>
                      {s.email && s.email !== 'N/A' ? s.email : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-mono">
                      {s.phone && s.phone !== 'N/A' ? s.phone : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md font-medium">
                        {s.branch || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono font-medium text-gray-700">
                      {s.enrollmentNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {s.status?.toLowerCase() === 'inactive' ? (
                          <AdminActionButton
                            action="activate"
                            onClick={() => handleReactivateStudent(s._id)}
                            title="Activate student"
                          />
                        ) : (
                          <AdminActionButton
                            action="deactivate"
                            onClick={() => handleDeactivateStudent(s._id)}
                            title="Deactivate student"
                          />
                        )}
                        <AdminActionButton
                          action="view"
                          onClick={() => setDetail(s)}
                          title="View student profile"
                        />
                        <AdminActionButton
                          action="delete"
                          onClick={() => handleRequestDelete(s)}
                          title="Remove student"
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
            {students.map((s) => (
              <div key={s._id} className="p-4 flex items-start gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden shadow-2xs">
                  <StudentAvatar photo={s.photo} name={s.name || s.username} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {s.name || s.username}
                    </p>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80 px-1.5 py-0.5 rounded font-semibold">
                      {s.branch || 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {s.enrollmentNumber ? `#${s.enrollmentNumber}` : ''}
                    {s.phone ? ` · ${s.phone}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDetail(s)}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      View details
                    </button>
                    <span className="text-gray-300">·</span>
                    {s.status?.toLowerCase() === 'inactive' ? (
                      <button
                        type="button"
                        onClick={() => handleReactivateStudent(s._id)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeactivateStudent(s._id)}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                      >
                        Deactivate
                      </button>
                    )}
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(s)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
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

      {/* ── Detail Drawer ── */}
      <StudentDetailDrawer student={detail} onClose={() => setDetail(null)} />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(delStu)}
        onClose={() => setDelStu(null)}
        onConfirm={handleDelete}
        title="Remove Student Record?"
        description={`"${delStu?.name || delStu?.username}" will be removed from the transit system.`}
        confirmLabel="Remove Student"
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
        onDeactivate={handleDeactivateStudent}
        loading={deactivating}
      />
    </div>
  );
};

export default StudentsPage;
