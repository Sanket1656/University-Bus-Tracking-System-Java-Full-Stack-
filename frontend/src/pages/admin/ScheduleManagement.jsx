import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Edit3,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Compass,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import scheduleApi from '../../api/scheduleApi';
import assignmentApi from '../../api/assignmentApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import PaginationControls from '../../components/ui/PaginationControls';
import { AdminSkeleton, SkeletonStatValue } from '../../components/ui/AdminSkeletons';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormInput from '../../components/ui/FormInput';
import SelectInput from '../../components/ui/SelectInput';
import AdminActionButton from '../../components/ui/AdminActionButton';
import { useToast } from '../../context/ToastContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DIRECTIONS = ['OUTBOUND', 'RETURN'];
const STATUSES = ['Active', 'Inactive'];
const EMPTY_FORM = {
  assignment: '',
  dayOfWeek: '',
  startTime: '',
  direction: '',
  status: 'Active',
};

const getId = (value) => (typeof value === 'object' ? value?._id : value) || '';

const getDriverName = (driver = {}) => driver.name || driver.username || '—';

const getAssignmentLabel = (assignment = {}) => {
  const bus = assignment.bus || {};
  const driver = assignment.driver || {};
  const route = assignment.route || {};
  const busName = bus.busNumber || bus.busName || bus.busRegistrationNumber || 'Bus';
  const driverName = getDriverName(driver);
  const routeName = route.routeCode || route.routeName || 'Route';
  return `${busName} • ${driverName} • ${routeName}`;
};

const getScheduleAssignment = (schedule) => schedule?.assignment || {};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const ScheduleForm = ({ initial, assignments, onSubmit, loading }) => {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    assignment: getId(initial?.assignment),
    dayOfWeek: initial?.dayOfWeek || '',
    startTime: initial?.startTime || '',
    direction: initial?.direction || '',
    status: initial?.status || 'Active',
  });
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(initial);

  const set = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.assignment) nextErrors.assignment = 'Select an assignment';
    if (!form.dayOfWeek) nextErrors.dayOfWeek = 'Select a day';
    if (!form.startTime) nextErrors.startTime = 'Select a start time';
    if (!form.direction) nextErrors.direction = 'Select a direction';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <SelectInput
        label="Operational Assignment"
        required
        value={form.assignment}
        onChange={(event) => set('assignment', event.target.value)}
        error={errors.assignment}
        placeholder="Select a bus, driver & route assignment…"
        options={assignments.map((assignment) => ({
          value: assignment._id,
          label: getAssignmentLabel(assignment),
        }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput
          label="Day of Week"
          required
          value={form.dayOfWeek}
          onChange={(event) => set('dayOfWeek', event.target.value)}
          error={errors.dayOfWeek}
          placeholder="Select operating day…"
          options={DAYS.map((day) => ({ value: day, label: day }))}
        />
        <FormInput
          label="Departure Start Time (24h)"
          required
          type="time"
          value={form.startTime}
          onChange={(event) => set('startTime', event.target.value)}
          error={errors.startTime}
          hint="e.g. 08:30 or 17:15"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput
          label="Trip Direction"
          required
          value={form.direction}
          onChange={(event) => set('direction', event.target.value)}
          error={errors.direction}
          placeholder="Select direction…"
          options={DIRECTIONS.map((direction) => ({ value: direction, label: direction }))}
        />
        <SelectInput
          label="Schedule Status"
          value={form.status}
          onChange={(event) => set('status', event.target.value)}
          options={STATUSES.map((status) => ({ value: status, label: status }))}
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
          <span>{isEdit ? 'Save Changes' : 'Create Schedule'}</span>
        </button>
      </div>
    </form>
  );
};

const ScheduleRow = ({ schedule, onEdit, onDeactivate }) => {
  const assignment = getScheduleAssignment(schedule);
  const bus = assignment.bus || {};
  const driver = assignment.driver || {};
  const route = assignment.route || {};

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-5 py-3.5 min-w-[220px]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Link2 className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
            {getAssignmentLabel(assignment)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs font-mono font-semibold text-gray-700 whitespace-nowrap">
        {bus.busNumber || bus.busName || '—'}
      </td>
      <td className="px-4 py-3.5 text-xs text-gray-700 font-medium whitespace-nowrap">
        {getDriverName(driver)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded">
          {route.routeCode || route.routeName || '—'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-gray-700 font-semibold whitespace-nowrap">
        {schedule.dayOfWeek}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="font-mono text-sm font-extrabold text-gray-950 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
          {schedule.startTime}
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${
            schedule.direction === 'OUTBOUND'
              ? 'bg-blue-50 text-blue-700 ring-blue-200/80'
              : 'bg-amber-50 text-amber-700 ring-amber-200/80'
          }`}
        >
          {schedule.direction === 'OUTBOUND' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownLeft className="w-3 h-3" />
          )}
          <span>{schedule.direction}</span>
        </span>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={schedule.status} size="sm" />
      </td>
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1 justify-end">
          <AdminActionButton action="edit" onClick={onEdit} title="Edit schedule" />
          {schedule.status === 'Active' && (
            <AdminActionButton
              action="delete"
              onClick={onDeactivate}
              title="Deactivate schedule"
            />
          )}
        </div>
      </td>
    </tr>
  );
};

const ScheduleManagement = () => {
  const { addToast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, outbound: 0, returnTrips: 0 });
  const [dayFilter, setDayFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleToDeactivate, setScheduleToDeactivate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const loadData = useCallback(
    async (showLoading = true, requestedPage = page) => {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      setLoadError(false);
      try {
        const [scheduleResponse, assignmentResponse] = await Promise.all([
          scheduleApi.getSchedules({
            page: requestedPage,
            limit: 10,
            search: debouncedSearch,
            dayOfWeek: dayFilter === 'all' ? undefined : dayFilter,
            direction: directionFilter === 'all' ? undefined : directionFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            assignment: assignmentFilter === 'all' ? undefined : assignmentFilter,
          }),
          assignmentApi.getAll(),
        ]);
        const nextPagination = scheduleResponse.data.pagination || {
          page: requestedPage,
          limit: 10,
          total: 0,
          totalPages: 1,
        };
        if (requestedPage > nextPagination.totalPages) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }
        setSchedules(scheduleResponse.data.data || []);
        setPagination(nextPagination);
        setSummary(scheduleResponse.data.summary || {
          total: nextPagination.total,
          active: 0,
          outbound: 0,
          returnTrips: 0,
        });
        setAssignments(
          (assignmentResponse.data.data || []).filter(
            (assignment) => assignment.status === 'Active'
          )
        );
      } catch (error) {
        setLoadError(true);
        addToast(getErrorMessage(error, 'Failed to load schedules'), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast, assignmentFilter, dayFilter, debouncedSearch, directionFilter, page, statusFilter]
  );

  useEffect(() => {
    loadData(true, page);
  }, [loadData, page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const filteredSchedules = schedules;

  const openCreate = () => {
    setEditingSchedule(null);
    setModalOpen(true);
  };
  const openEdit = (schedule) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
  };
  const closeModal = () => {
    if (!saving) {
      setModalOpen(false);
      setEditingSchedule(null);
    }
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editingSchedule) {
        await scheduleApi.updateSchedule(editingSchedule._id, form);
        addToast('Schedule updated successfully.', 'success');
      } else {
        await scheduleApi.createSchedule(form);
        addToast('Schedule created successfully.', 'success');
      }
      setModalOpen(false);
      setEditingSchedule(null);
      await loadData(false);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to save schedule'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await scheduleApi.deleteSchedule(scheduleToDeactivate._id);
      addToast('Schedule deactivated successfully.', 'success');
      setScheduleToDeactivate(null);
      await loadData(false);
    } catch (error) {
      addToast(getErrorMessage(error, 'Failed to deactivate schedule'), 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: summary.total,
      active: summary.active,
      outbound: summary.outbound,
      returnTrips: summary.returnTrips,
    };
  }, [summary]);

  const deactivateDetails = scheduleToDeactivate && getScheduleAssignment(scheduleToDeactivate);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Schedule Management"
        description="Manage daily university bus departures, routes, and operational timetables"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Departures"
          value={loading ? <SkeletonStatValue /> : stats.total}
          icon={CalendarDays}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Configured timetable slots"
        />
        <StatCard
          title="Active Timetables"
          value={loading ? <SkeletonStatValue /> : stats.active}
          icon={Clock3}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Currently in service"
        />
        <StatCard
          title="Outbound Trips"
          value={loading ? <SkeletonStatValue /> : stats.outbound}
          icon={ArrowUpRight}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Campus inbound / outbound"
        />
        <StatCard
          title="Return Trips"
          value={loading ? <SkeletonStatValue /> : stats.returnTrips}
          icon={ArrowDownLeft}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Evening return circuits"
        />
      </div>

      {/* ── Multi-Filter Bar ── */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 min-w-[200px]">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
              }}
              placeholder="Search by bus, driver, route code or time…"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={dayFilter}
              onChange={(e) => {
                setDayFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
            >
              <option value="all">All Days</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(e) => {
                setDirectionFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
            >
              <option value="all">All Directions</option>
              {DIRECTIONS.map((dir) => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
            >
              <option value="all">All Status</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <select
            value={assignmentFilter}
            onChange={(e) => {
              setAssignmentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:max-w-md h-10 px-3 text-xs sm:text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            <option value="all">All Vehicle Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment._id} value={assignment._id}>
                {getAssignmentLabel(assignment)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3 justify-end">
            <span className="text-xs text-gray-500 font-medium">
              {filteredSchedules.length} of {pagination.total} departures
            </span>
            <button
              type="button"
              onClick={() => loadData(false, page)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Table / Empty Surface ── */}
      {loading ? (
        <AdminSkeleton variant="table" rows={6} columns={9} />
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-rose-200 shadow-xs py-14 px-6 text-center">
          <p className="text-sm font-bold text-gray-900">Could not load timetable schedules</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Check backend connection and retry.</p>
          <button
            type="button"
            onClick={() => loadData()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl"
          >
            Try Again
          </button>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
          <EmptyState
            icon={CalendarDays}
            isSearch={Boolean(
              search ||
                dayFilter !== 'all' ||
                directionFilter !== 'all' ||
                statusFilter !== 'all' ||
                assignmentFilter !== 'all'
            )}
            title="No schedules found"
            description="Create your first recurring bus schedule or adjust active filters."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                + Add Schedule
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200/80 bg-gray-50/70 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Transit Timetable Roster
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Standard 24-hour university departures</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80">
                  {[
                    'Assignment',
                    'Bus',
                    'Driver',
                    'Route',
                    'Operating Day',
                    'Start Time (24h)',
                    'Direction',
                    'Status',
                    'Actions',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${
                        heading === 'Actions' ? 'text-right pr-5' : ''
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSchedules.map((schedule) => (
                  <ScheduleRow
                    key={schedule._id}
                    schedule={schedule}
                    onEdit={() => openEdit(schedule)}
                    onDeactivate={() => setScheduleToDeactivate(schedule)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-200/80 text-xs text-gray-500 flex items-center justify-between">
            <span>Showing {filteredSchedules.length} of {pagination.total} schedules</span>
            <span className="text-purple-700 font-medium">Daily operations schedule</span>
          </div>
        </div>
      )}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        loading={loading}
        onPageChange={(nextPage) => {
          if (nextPage >= 1 && nextPage <= pagination.totalPages) setPage(nextPage);
        }}
      />

      {/* ── Modal Form ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        subtitle={
          editingSchedule
            ? 'Update the departure time, operating day, or assignment'
            : 'Set a recurring university bus departure timetable'
        }
        size="md"
      >
        <ScheduleForm
          key={editingSchedule?._id || 'new'}
          initial={editingSchedule}
          assignments={assignments}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

      {/* ── Deactivate Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(scheduleToDeactivate)}
        onClose={() => {
          if (!deactivating) setScheduleToDeactivate(null);
        }}
        onConfirm={handleDeactivate}
        title="Deactivate Daily Schedule?"
        confirmLabel="Deactivate"
        loading={deactivating}
        description={
          deactivateDetails
            ? `${deactivateDetails.bus?.busNumber || deactivateDetails.bus?.busName || 'Bus'} • ${getDriverName(
                deactivateDetails.driver
              )} • ${deactivateDetails.route?.routeCode || deactivateDetails.route?.routeName || 'Route'} • ${
                scheduleToDeactivate.dayOfWeek
              } at ${scheduleToDeactivate.startTime} (${scheduleToDeactivate.direction})`
            : 'This departure schedule will be paused from active operations.'
        }
      />
    </div>
  );
};

export default ScheduleManagement;