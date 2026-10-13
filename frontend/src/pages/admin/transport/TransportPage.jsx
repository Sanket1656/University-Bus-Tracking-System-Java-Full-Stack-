import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Bus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Inbox,
  UserCheck,
  Armchair,
  ArrowLeftRight,
  Search,
  X,
  MapPin,
  Phone,
  GraduationCap,
  Hash,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import transportApi from '../../../api/transportApi';
import assignmentApi from '../../../api/assignmentApi';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';
import { AdminSkeleton } from '../../../components/ui/AdminSkeletons';
import SelectInput from '../../../components/ui/SelectInput';
import FormInput from '../../../components/ui/FormInput';
import AdminActionButton from '../../../components/ui/AdminActionButton';
import { useToast } from '../../../context/ToastContext';

// ── helpers ────────────────────────────────────────────────────────────────────
const sName = (req) => req?.student?.studentProfile?.name || req?.student?.username || '—';
const sBranch = (req) => req?.student?.studentProfile?.branch || '—';
const sEnroll = (req) => req?.student?.studentProfile?.enrollmentNumber || '—';
const sPhone = (req) => req?.student?.studentProfile?.phone || '—';
const stopName = (req) => req?.preferredStop?.stopName || '—';
const getInitials = (n = '') =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'ST';
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

// ── Reject modal ───────────────────────────────────────────────────────────────
const RejectModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [remarks, setRemarks] = useState('');
  const handleConfirm = () => {
    onConfirm(remarks);
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Transport Request"
      subtitle="The student will be notified of the decision. This cannot be undone."
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            Reject Request
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Rejection Remarks (Optional)
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="State the reason for rejecting this transport application…"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none shadow-2xs"
        />
      </div>
    </Modal>
  );
};

// ── Change Seat modal ──────────────────────────────────────────────────────────
const ChangeSeatModal = ({ isOpen, onClose, onConfirm, loading, currentSeat }) => {
  const [seat, setSeat] = useState(currentSeat ?? '');

  const handleConfirm = () => {
    const n = Number(seat);
    if (!Number.isInteger(n) || n <= 0) return;
    onConfirm(n);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Seat Assignment"
      subtitle="Assign an available seat number for this student"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !seat}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            Update Seat
          </button>
        </>
      }
    >
      <FormInput
        label="New Seat Number"
        required
        type="number"
        min={1}
        value={seat}
        onChange={(e) => setSeat(e.target.value)}
        placeholder="e.g. 14"
        hint="Must be a positive integer"
      />
    </Modal>
  );
};

// ── Assignment & Student Stop Matching Helper ─────────────────────────────────
const checkAssignmentEligibility = (assignment, studentRequest) => {
  if (!assignment) {
    return { eligible: false, reason: 'Invalid assignment.' };
  }
  if (assignment.status !== 'Active') {
    return { eligible: false, reason: 'This assignment is inactive and cannot accept new students.' };
  }
  if (assignment.bus?.busStatus && assignment.bus.busStatus.toLowerCase() !== 'active') {
    return { eligible: false, reason: `Associated bus (${assignment.bus.busNumber || ''}) is ${assignment.bus.busStatus.toLowerCase()}.` };
  }
  if (assignment.route?.status && assignment.route.status.toLowerCase() === 'inactive') {
    return { eligible: false, reason: 'This assignment cannot accept students because its route is inactive.' };
  }
  const stops = assignment.route?.stops || assignment.route?.routeStops || [];
  if (stops.length === 0) {
    return { eligible: false, reason: "This assignment's route has no configured stops." };
  }
  if (studentRequest) {
    const preferredStop = studentRequest.preferredStop;
    if (!preferredStop) {
      return { eligible: false, reason: 'Student must select a preferred pickup stop before assignment.' };
    }
    const stopId = String(preferredStop.id ?? preferredStop._id);
    const hasStop = stops.some((s) => {
      const sId = String(s.stop?.id ?? s.stop?._id ?? s.id ?? s._id);
      return sId === stopId;
    });
    if (!hasStop) {
      return {
        eligible: false,
        reason: `Not eligible — preferred stop (${preferredStop.stopName || 'None'}) is not on this route.`,
      };
    }
    const asgnId = String(assignment._id || assignment.id);
    const studentAsgnId = String(studentRequest.assignment?._id || studentRequest.assignment?.id || '');
    if (studentAsgnId && studentAsgnId === asgnId) {
      return { eligible: false, reason: 'Student is already assigned to this assignment.' };
    }
  }
  return { eligible: true, reason: null };
};

// ── Change Assignment modal ────────────────────────────────────────────────────
const ChangeAssignmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  assignments,
  currentAssignmentId,
  studentRequest,
}) => {
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (isOpen) setSelected('');
  }, [isOpen]);

  const preferredStop = studentRequest?.preferredStop;
  const preferredStopId = preferredStop ? String(preferredStop.id ?? preferredStop._id) : null;

  const options = assignments
    .filter((a) => a.status === 'Active' && String(a._id || a.id) !== String(currentAssignmentId))
    .map((a) => {
      const stops = a.route?.stops || a.route?.routeStops || [];
      const hasStop = preferredStopId
        ? stops.some((s) => String(s.stop?.id ?? s.stop?._id ?? s.id ?? s._id) === preferredStopId)
        : true;
      return {
        value: a._id || a.id,
        label: `${a.bus?.busName || 'Bus'} (${a.bus?.busRegistrationNumber || ''}) — ${
          a.route?.routeName || 'Route'
        }${!hasStop ? ' [Not Eligible — Pickup stop not on route]' : ''}`,
        disabled: !hasStop,
        isEligible: hasStop,
      };
    });

  const eligibleOptions = options.filter((o) => o.isEligible);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Bus Corridor"
      subtitle={
        preferredStop
          ? `Transfer student to another active corridor containing ${preferredStop.stopName}`
          : 'Transfer student to another active bus assignment'
      }
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={loading || !selected}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            Confirm Transfer
          </button>
        </>
      }
    >
      {eligibleOptions.length === 0 ? (
        <div className="py-4 text-center space-y-2">
          <p className="text-xs text-amber-700 font-semibold">
            No compatible assignments found for pickup stop: {preferredStop?.stopName || 'None'}
          </p>
          <p className="text-[11px] text-gray-500">
            A student can only be reassigned to an active assignment whose route includes their preferred pickup stop.
          </p>
        </div>
      ) : (
        <SelectInput
          label="Target Active Assignment"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Choose replacement assignment…"
          options={eligibleOptions}
        />
      )}
    </Modal>
  );
};

// ── Assign Students modal (pending → approved) ─────────────────────────────────
const AssignStudentsModal = ({ isOpen, onClose, onDone, assignments, targetStudent }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [selAssignment, setSelAssign] = useState('');
  const [assignmentInfo, setAInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState({});
  const [seats, setSeats] = useState({});

  const activeAssignments = assignments.filter((a) => a.status === 'Active');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelAssign('');
      setAInfo(null);
      setStudents([]);
      setChecked({});
      setSeats({});
    } else if (targetStudent && activeAssignments.length > 0) {
      // Find assignment that is eligible for targetStudent
      const matchingAssign = activeAssignments.find((a) => {
        const eligibility = checkAssignmentEligibility(a, targetStudent);
        return eligibility.eligible;
      });
      if (matchingAssign) {
        setSelAssign(matchingAssign._id || matchingAssign.id);
      }
    }
  }, [isOpen, targetStudent]);

  const loadEligible = useCallback(
    async (id) => {
      setLoading(true);
      try {
        const res = await transportApi.getPendingStudentsForAssignment(id);
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const assign =
          res.data?.assignment ||
          assignments.find((a) => String(a._id || a.id) === String(id)) ||
          null;
        setAInfo(assign);
        setStudents(list);
        if (targetStudent) {
          const tId = String(targetStudent._id || targetStudent.id);
          const match = list.some((s) => String(s._id || s.id) === tId);
          if (match) {
            setChecked({ [tId]: true });
          }
        }
        setStep(2);
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load eligible students', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addToast, assignments, targetStudent]
  );

  const handleNext = () => {
    if (!selAssignment) return;
    if (targetStudent) {
      const selectedAssignObj = assignments.find((a) => String(a._id || a.id) === String(selAssignment));
      const eligibility = checkAssignmentEligibility(selectedAssignObj, targetStudent);
      if (!eligibility.eligible) {
        addToast(
          eligibility.reason ||
            "Cannot assign this student to this assignment. The student's preferred pickup stop is not included in the selected assignment's route.",
          'error'
        );
        return;
      }
    }
    loadEligible(selAssignment);
  };

  const toggleCheck = (id) => setChecked((p) => ({ ...p, [id]: !p[id] }));

  const setSeat = (id, val) => setSeats((p) => ({ ...p, [id]: val }));

  const handleAssign = async () => {
    if (saving) return; // Duplicate API call protection
    const selected = students.filter((s) => checked[s._id || s.id]);
    if (!selected.length) {
      addToast('Select at least one student to approve', 'warning');
      return;
    }
    const invalid = selected.find((s) => {
      const sid = s._id || s.id;
      return !seats[sid] || Number(seats[sid]) <= 0;
    });
    if (invalid) {
      addToast('Enter a valid seat number (positive integer) for every selected student', 'warning');
      return;
    }
    const capacity = assignmentInfo?.bus?.busCapacity;
    if (capacity) {
      const overCapacity = selected.find((s) => {
        const sid = s._id || s.id;
        return Number(seats[sid]) > capacity;
      });
      if (overCapacity) {
        addToast(`Seat number exceeds bus capacity of ${capacity}`, 'warning');
        return;
      }
    }
    // Check duplicate seats in selection
    const seatSet = new Set();
    for (const s of selected) {
      const sid = s._id || s.id;
      const seatNum = Number(seats[sid]);
      if (seatSet.has(seatNum)) {
        addToast(`Seat number #${seatNum} is duplicated in your selection. Each student must have a unique seat.`, 'warning');
        return;
      }
      seatSet.add(seatNum);
    }

    const payload = selected.map((s) => {
      const sid = s._id || s.id;
      return {
        requestId: sid,
        seatNumber: Number(seats[sid]),
      };
    });

    setSaving(true);
    try {
      await transportApi.assignStudents(selAssignment, payload);
      addToast(`${selected.length} student(s) approved and assigned!`, 'success');
      onDone();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign students';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Select Route Assignment' : 'Approve & Assign Seats'}
      subtitle={
        step === 1
          ? 'Choose an active fleet assignment to assign eligible pending students'
          : `${students.length} eligible student(s) matching this route · ${checkedCount} selected`
      }
      size="lg"
      footer={
        step === 1 ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!selAssignment || loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              )}
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={saving || checkedCount === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              )}
              <span>Approve & Assign {checkedCount > 0 && `(${checkedCount})`}</span>
            </button>
          </>
        )
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          {activeAssignments.length === 0 ? (
            <EmptyState
              icon={Bus}
              title="No active assignments available"
              description="Create and activate an assignment in Fleet Assignments first."
            />
          ) : (
            <div className="space-y-2">
              {activeAssignments.map((a) => {
                const aId = a._id || a.id;
                const bus = a.bus || {};
                const route = a.route || {};
                const sel = String(selAssignment) === String(aId);
                const eligibility = checkAssignmentEligibility(a, targetStudent);
                const isEligible = eligibility.eligible;

                return (
                  <div
                    key={aId}
                    onClick={() => {
                      if (!isEligible) {
                        addToast(eligibility.reason || 'This assignment is not eligible for this student.', 'warning');
                        return;
                      }
                      setSelAssign(aId);
                    }}
                    className={`w-full flex flex-col p-3.5 rounded-xl border text-left transition-all ${
                      !isEligible
                        ? 'border-gray-200 bg-gray-50/70 opacity-75 cursor-not-allowed'
                        : sel
                        ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-600 shadow-2xs cursor-pointer'
                        : 'border-gray-200 hover:border-purple-300 bg-white hover:bg-gray-50/50 shadow-2xs cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isEligible ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}>
                        <Bus className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {bus.busName || 'Bus'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {route.routeName || 'Route'} · {bus.busCapacity || 0} total seats
                        </p>
                      </div>
                      {targetStudent && isEligible && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Eligible</span>
                        </span>
                      )}
                      {sel && <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                    </div>
                    {targetStudent && !isEligible && (
                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{eligibility.reason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3.5">
          {/* Assignment summary pill */}
          {assignmentInfo && (
            <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs font-semibold text-purple-900">
              <span className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-purple-600" />
                {assignmentInfo.bus?.busName} ({assignmentInfo.bus?.busRegistrationNumber})
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                Capacity: {assignmentInfo.bus?.busCapacity} seats
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                {assignmentInfo.route?.routeName}
              </span>
            </div>
          )}

          {students.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No eligible students found"
              description="No pending student requests have preferred stops that fall on this route."
            />
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Eligible Route Applicants
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = Object.values(checked).every(Boolean) && Object.keys(checked).length === students.length;
                    const nextChecked = {};
                    students.forEach((s) => {
                      const sid = s._id || s.id;
                      nextChecked[sid] = !allChecked;
                    });
                    setChecked(nextChecked);
                  }}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  {Object.values(checked).every(Boolean) &&
                  Object.keys(checked).length === students.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {students.map((s) => {
                  const sid = s._id || s.id;
                  return (
                    <div
                      key={sid}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        checked[sid] ? 'bg-purple-50/40' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checked[sid])}
                        onChange={() => toggleCheck(sid)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                      />
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(sName(s))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {sName(s)}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {sBranch(s)} · Preferred Stop:{' '}
                          <span className="font-semibold text-gray-700">{stopName(s)}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-24">
                        <input
                          type="number"
                          min={1}
                          disabled={!checked[sid]}
                          value={seats[sid] || ''}
                          onChange={(e) => setSeat(sid, e.target.value)}
                          placeholder="Seat #"
                          className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-2xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ── Assignment Students Drawer ─────────────────────────────────────────────────
const AssignmentStudentsDrawer = ({
  assignmentId,
  assignments,
  onClose,
  onRefresh,
}) => {
  const { addToast } = useToast();
  const [info, setInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatTarget, setSeatTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transportApi.getAssignmentStudents(assignmentId);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      const assign =
        res.data?.assignment ||
        assignments?.find((a) => String(a._id || a.id) === String(assignmentId)) ||
        null;
      setInfo(assign);
      setStudents(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, assignments, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangeSeat = async (newSeat) => {
    setSeatLoading(true);
    try {
      await transportApi.changeSeat(seatTarget._id || seatTarget.id, newSeat);
      addToast('Seat updated successfully', 'success');
      setSeatTarget(null);
      load();
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update seat', 'error');
    } finally {
      setSeatLoading(false);
    }
  };

  const handleChangeAssignment = async (newAssignmentId) => {
    setAssignLoading(true);
    try {
      await transportApi.changeAssignment(assignTarget._id || assignTarget.id, newAssignmentId);
      addToast('Assignment changed successfully', 'success');
      setAssignTarget(null);
      load();
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change assignment', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const bus = info?.bus || {};
  const route = info?.route || {};

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden my-auto h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-start justify-between text-white flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{bus.busName || 'Assignment Roster'}</h2>
              <p className="text-purple-200 text-xs mt-0.5 truncate">
                {route.routeName || '—'} · {students.length} assigned students
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors ml-3 flex-shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs text-gray-600">
            <span className="font-mono font-medium">{bus.busRegistrationNumber}</span>
            <span>Capacity: {bus.busCapacity || 0}</span>
            <span className="text-purple-700 font-bold">{students.length} Allocated</span>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-4">
                <AdminSkeleton variant="list" count={4} />
              </div>
            ) : students.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="No students assigned"
                  description="Use 'Assign Students' to link approved applicants to this bus."
                />
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s._id || s.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(sName(s))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{sName(s)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {sBranch(s)} · Seat{' '}
                        <span className="font-bold text-purple-700 font-mono">
                          #{s.seatNumber ?? '—'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSeatTarget(s)}
                      title="Change Seat"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Armchair className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignTarget(s)}
                      title="Change Assignment Corridor"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ChangeSeatModal
        isOpen={Boolean(seatTarget)}
        onClose={() => setSeatTarget(null)}
        onConfirm={handleChangeSeat}
        loading={seatLoading}
        currentSeat={seatTarget?.seatNumber}
      />
      <ChangeAssignmentModal
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        onConfirm={handleChangeAssignment}
        loading={assignLoading}
        assignments={assignments}
        currentAssignmentId={assignmentId}
      />
    </>
  );
};

// ── Pending Request Card ───────────────────────────────────────────────────────
const PendingCard = ({ req, onReject, onAssign }) => (
  <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs hover:border-gray-300/80 transition-all flex flex-col justify-between h-full p-5">
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
            {getInitials(sName(req))}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{sName(req)}</h3>
            <p className="text-[11px] text-gray-400 font-mono truncate">{sEnroll(req)}</p>
          </div>
        </div>
        <StatusBadge status="Pending" size="xs" />
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="truncate">{sBranch(req)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-gray-800 truncate">{stopName(req)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-mono truncate">{sPhone(req)}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span>Requested on {fmtDate(req.createdAt)}</span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-gray-100">
      <button
        type="button"
        onClick={() => onAssign(req)}
        className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-2xs text-center"
      >
        Assign & Approve
      </button>
      <button
        type="button"
        onClick={() => onReject(req)}
        className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors text-center"
      >
        Reject
      </button>
    </div>
  </div>
);

// ── Approved student row ───────────────────────────────────────────────────────
const ApprovedRow = ({ req, assignments, onRefresh }) => {
  const { addToast } = useToast();
  const [seatTarget, setSeatTarget] = useState(false);
  const [assignTarget, setAssignTarget] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const asgn = req.assignment || {};
  const bus = asgn.bus || {};
  const route = asgn.route || {};

  const handleChangeSeat = async (newSeat) => {
    setSeatLoading(true);
    try {
      await transportApi.changeSeat(req._id || req.id, newSeat);
      addToast('Seat updated successfully', 'success');
      setSeatTarget(false);
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update seat', 'error');
    } finally {
      setSeatLoading(false);
    }
  };

  const handleChangeAssignment = async (newId) => {
    setAssignLoading(true);
    try {
      await transportApi.changeAssignment(req._id || req.id, newId);
      addToast('Assignment changed successfully', 'success');
      setAssignTarget(false);
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change assignment', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50/70 transition-colors">
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
              {getInitials(sName(req))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{sName(req)}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{sEnroll(req)}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">
          <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md font-semibold text-[11px]">
            {sBranch(req)}
          </span>
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-800 font-semibold truncate max-w-[160px]">
          {bus.busName || 'Bus'}
          <span className="block text-[11px] text-gray-400 font-normal truncate">
            {route.routeName || '—'}
          </span>
        </td>
        <td className="px-4 py-3.5 text-xs text-emerald-800 font-medium truncate max-w-[140px]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            {stopName(req)}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center gap-1 text-xs font-mono font-extrabold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-md">
            <Armchair className="w-3 h-3 text-purple-600" />
            {req.seatNumber ?? '—'}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <StatusBadge status="Approved" size="sm" />
        </td>
        <td className="px-5 py-3.5 text-right">
          <div className="inline-flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => setSeatTarget(true)}
              title="Change Seat"
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Armchair className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAssignTarget(true)}
              title="Change Assignment Corridor"
              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      <ChangeSeatModal
        isOpen={seatTarget}
        onClose={() => setSeatTarget(false)}
        onConfirm={handleChangeSeat}
        loading={seatLoading}
        currentSeat={req.seatNumber}
      />
      <ChangeAssignmentModal
        isOpen={assignTarget}
        onClose={() => setAssignTarget(false)}
        onConfirm={handleChangeAssignment}
        loading={assignLoading}
        assignments={assignments}
        currentAssignmentId={asgn._id || asgn.id}
      />
    </>
  );
};

// ── Main Page Component ────────────────────────────────────────────────────────
const TransportPage = () => {
  const { addToast } = useToast();
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [drawerAssignId, setDrawerAssignId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, asRes] = await Promise.all([
        transportApi.getPendingRequests(),
        transportApi.getApprovedRequests(),
        assignmentApi.getAll(),
      ]);
      const extractList = (res) => {
        if (!res?.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
        return [];
      };
      setPending(extractList(pRes));
      setApproved(extractList(aRes));
      setAssignments(extractList(asRes));
    } catch (err) {
      console.error('Failed to load transport data:', err);
      addToast('Unable to load transport requests. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReject = async (remarks) => {
    setRejectLoading(true);
    try {
      await transportApi.rejectRequest(rejectTarget._id || rejectTarget.id, remarks);
      addToast('Request rejected successfully', 'success');
      setRejectTarget(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  const filterFn = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      [sName(r), sBranch(r), sEnroll(r), stopName(r), r.student?.username || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  };

  const filteredPending = filterFn(pending);
  const filteredApproved = filterFn(approved);

  // Group approved by assignment for the assignment tab
  const byAssignment = useMemo(() => {
    const map = {};
    approved.forEach((r) => {
      const id = r.assignment?._id || r.assignment?.id || 'unassigned';
      if (!map[id]) map[id] = { assignment: r.assignment, rows: [] };
      map[id].rows.push(r);
    });
    return map;
  }, [approved]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Transport Management"
        description="Manage student transport applications, verified approvals, bus assignments and seat allocations"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={() => {
              setTargetStudent(null);
              setAssignModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Assign Students</span>
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={pending.length}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Awaiting seat assignment"
        />
        <StatCard
          title="Approved Students"
          value={approved.length}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Transit passes active"
        />
        <StatCard
          title="Active Assignments"
          value={assignments.filter((a) => a.status === 'Active').length}
          icon={Bus}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Operating fleet routes"
        />
        <StatCard
          title="Assignment Groups"
          value={Object.keys(byAssignment).length}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Configured bus pools"
        />
      </div>

      {/* ── Strong Tab Navigation + Search Filter ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Visually strong tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'pending', label: 'Pending', count: pending.length },
            { id: 'approved', label: 'Approved', count: approved.length },
            { id: 'assignments', label: 'By Assignment', count: Object.keys(byAssignment).length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSearch('');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === t.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar + refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students, branch or stop…"
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="h-10 px-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors shadow-2xs flex-shrink-0"
            title="Refresh transport requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Tab Views ── */}
      {loading ? (
        <AdminSkeleton variant="card" count={6} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" />
      ) : (
        <>
          {/* ── 1. PENDING REQUESTS TAB ── */}
          {tab === 'pending' && (
            filteredPending.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
                <EmptyState
                  icon={Clock}
                  isSearch={Boolean(search)}
                  title={search ? 'No pending requests match your query' : 'All requests processed'}
                  description={
                    search
                      ? 'Try adjusting your search keywords.'
                      : 'There are currently no pending student transport applications requiring review.'
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-medium">
                  <span>{filteredPending.length} pending transport application(s) awaiting approval</span>
                  <span className="text-amber-700 font-semibold">Review and allocate seating</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPending.map((r) => (
                    <PendingCard
                      key={r._id || r.id}
                      req={r}
                      onReject={() => setRejectTarget(r)}
                      onAssign={(student) => {
                        setTargetStudent(student);
                        setAssignModal(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* ── 2. APPROVED STUDENTS TAB ── */}
          {tab === 'approved' && (
            filteredApproved.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
                <EmptyState
                  icon={CheckCircle2}
                  isSearch={Boolean(search)}
                  title={search ? 'No approved students match your query' : 'No approved students yet'}
                  description={
                    search
                      ? 'Try searching with another name or enrollment number.'
                      : 'Approved transport requests and assigned seat numbers will appear here.'
                  }
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200/80">
                        <th className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Assigned Bus & Route
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Pickup Stop
                        </th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Seat
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
                      {filteredApproved.map((r) => (
                        <ApprovedRow
                          key={r._id || r.id}
                          req={r}
                          assignments={assignments}
                          onRefresh={fetchData}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-200/80 text-xs text-gray-500 flex items-center justify-between">
                  <span>Showing {filteredApproved.length} of {approved.length} approved students</span>
                  <span className="text-purple-700 font-medium">Active transit roster</span>
                </div>
              </div>
            )
          )}

          {/* ── 3. BY ASSIGNMENT TAB ── */}
          {tab === 'assignments' && (
            Object.keys(byAssignment).length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs">
                <EmptyState
                  icon={Bus}
                  title="No assignment groupings found"
                  description="Students will be grouped by their assigned bus and route corridor."
                />
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(byAssignment).map(([id, { assignment: asgn, rows }]) => {
                  const bus = asgn?.bus || {};
                  const route = asgn?.route || {};
                  const driver = asgn?.driver || {};
                  const capacity = bus.busCapacity || 0;
                  const allocated = rows.length;

                  return (
                    <div
                      key={id}
                      className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden"
                    >
                      {/* Group Header */}
                      <div className="px-5 py-4 border-b border-gray-200/80 bg-gradient-to-r from-purple-50/60 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Bus className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                {bus.busName || 'Unassigned Fleet Pool'}
                              </h3>
                              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded">
                                {bus.busRegistrationNumber || 'GJ-XX'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              Corridor: <span className="font-semibold text-gray-700">{route.routeName || '—'}</span> · Driver: {driver.name || driver.username || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end flex-shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-purple-900 block">
                              {allocated} / {capacity || '—'} Seats Filled
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {capacity > 0 ? `${Math.max(0, capacity - allocated)} available` : 'Roster total'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDrawerAssignId(id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-colors shadow-2xs"
                          >
                            <span>Manage Roster</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Group Students Preview */}
                      <div className="divide-y divide-gray-100">
                        {rows.slice(0, 3).map((r) => (
                          <div
                            key={r._id || r.id}
                            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {getInitials(sName(r))}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  {sName(r)}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {sBranch(r)} · Pickup: {stopName(r)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded">
                                Seat #{r.seatNumber ?? '—'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {rows.length > 3 && (
                          <div className="px-5 py-2.5 text-center bg-gray-50/50">
                            <button
                              type="button"
                              onClick={() => setDrawerAssignId(id)}
                              className="text-xs font-bold text-purple-700 hover:text-purple-800"
                            >
                              + View all {rows.length} assigned students →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* ── Modals & Drawers ── */}
      <RejectModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      <AssignStudentsModal
        isOpen={assignModal}
        onClose={() => {
          setAssignModal(false);
          setTargetStudent(null);
        }}
        onDone={fetchData}
        assignments={assignments}
        targetStudent={targetStudent}
      />

      {drawerAssignId && (
        <AssignmentStudentsDrawer
          assignmentId={drawerAssignId}
          assignments={assignments}
          onClose={() => setDrawerAssignId(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default TransportPage;
