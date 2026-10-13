import React, { useState, useEffect, useCallback } from 'react';
import transportRequestApi from '../../../api/transportRequestApi';
import { useToast } from '../../../context/ToastContext';
import TransportStatusCard from '../../../components/student/transport/TransportStatusCard';
import ApplyTransportModal from '../../../components/student/transport/ApplyTransportModal';
import ChangePreferredStopModal from '../../../components/student/transport/ChangePreferredStopModal';
import CancelTransportModal from '../../../components/student/transport/CancelTransportModal';
import { Bus } from 'lucide-react';

const StudentTransport = () => {
  const { addToast } = useToast();

  const [request, setRequest]   = useState(null);  // null = no request
  const [loading, setLoading]   = useState(true);

  /* modal visibility */
  const [applyOpen,      setApplyOpen]      = useState(false);
  const [changeStopOpen, setChangeStopOpen] = useState(false);
  const [cancelOpen,     setCancelOpen]     = useState(false);

  /* ── Fetch student's current transport request ── */
  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transportRequestApi.getMyTransportRequest();
      const req = data?.data !== undefined ? data.data : (data?.id ? data : null);
      setRequest(req ?? null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        /* 404 = no active request — not a system error */
        setRequest(null);
      } else {
        const msg = err.response?.data?.message || 'Failed to load transport data.';
        addToast(msg, 'error');
        setRequest(null);
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  /* ── Derived values for modals ── */
  const currentStopName =
    request?.preferredStop?.stopName ||
    request?.preferredStop?.name ||
    null;

  const currentStatus = request?.status ?? null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Bus className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transport</h1>
          <p className="text-sm text-gray-500">Manage your university transportation</p>
        </div>
      </div>

      {/* Transport Status Card */}
      <TransportStatusCard
        request={request}
        loading={loading}
        onApply={() => setApplyOpen(true)}
        onChangeStop={() => setChangeStopOpen(true)}
        onCancel={() => setCancelOpen(true)}
      />

      {/* ── Modals ── */}
      <ApplyTransportModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={fetchRequest}
      />

      <ChangePreferredStopModal
        isOpen={changeStopOpen}
        onClose={() => setChangeStopOpen(false)}
        onSuccess={fetchRequest}
        currentStop={currentStopName}
        currentStatus={currentStatus}
      />

      <CancelTransportModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSuccess={fetchRequest}
        currentStatus={currentStatus}
      />
    </div>
  );
};

export default StudentTransport;
