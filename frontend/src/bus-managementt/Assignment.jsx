import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from './components/StatCard';
import Toast from './components/Toast';
import AssignmentCard from './assignment-components/AssignmentCard';
import AssignmentDetailsDrawer from './assignment-components/AssignmentDetailsDrawer';
import AddAssignmentModal from './assignment-components/AddAssignmentModal';
import DeleteAssignmentConfirmModal from './assignment-components/DeleteAssignmentConfirmModal';
import AssignmentSkeletonLoader from './assignment-components/AssignmentSkeletonLoader';
import AssignmentEmptyState from './assignment-components/AssignmentEmptyState';

const AssignmentManagement = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [assignments,         setAssignments]         = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [buses,               setBuses]               = useState([]);
  const [drivers,             setDrivers]             = useState([]);
  const [routes,              setRoutes]              = useState([]);
  const [loading,             setLoading]             = useState(true);

  const [searchTerm,    setSearchTerm]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [routeFilter,   setRouteFilter]   = useState('all');

  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);

  const [selectedAssignment,  setSelectedAssignment]  = useState(null);
  const [editAssignment,      setEditAssignment]      = useState(null);
  const [assignmentToDelete,  setAssignmentToDelete]  = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, buses: 0 });

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const calculateStats = (data) => {
    const active   = data.filter((a) => a.status === 'Active').length;
    const inactive = data.filter((a) => a.status === 'Inactive').length;
    const uniqueBuses = new Set(
      data.map((a) => a.bus?._id || a.bus).filter(Boolean)
    ).size;
    setStats({ total: data.length, active, inactive, buses: uniqueBuses });
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res  = await apiClient.get('/assignment/get-all-assignments');
      const data = res.data.data || [];
      setAssignments(data);
      setFilteredAssignments(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      showToast('Failed to fetch assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [busRes, driverRes, routeRes] = await Promise.all([
        apiClient.get('/bus/get-all-buses'),
        apiClient.get('/auth/get-all-drivers'),
        apiClient.get('/routes/get-all-routes'),
      ]);
      setBuses(busRes.data.data     || busRes.data     || []);
      setDrivers(driverRes.data.data || driverRes.data || []);
      setRoutes(routeRes.data.data   || routeRes.data  || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchDropdowns();
  }, []);

  // ─── Filter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...assignments];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((a) => {
        const busName    = (a.bus?.busName    || a.bus?.name    || '').toLowerCase();
        const driverName = (a.driver?.name    || a.driver?.fullName || a.driver?.driverName || '').toLowerCase();
        const routeName  = (a.route?.routeName || a.route?.name  || '').toLowerCase();
        const routeCode  = (a.route?.routeCode || a.route?.code  || '').toLowerCase();
        return busName.includes(q) || driverName.includes(q) || routeName.includes(q) || routeCode.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (routeFilter !== 'all') {
      filtered = filtered.filter((a) => {
        const rid = a.route?._id || a.route;
        return rid === routeFilter;
      });
    }

    setFilteredAssignments(filtered);
  }, [searchTerm, statusFilter, routeFilter, assignments]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleCreateAssignment = async (formData) => {
    try {
      if (editAssignment) {
        await apiClient.put(
          `/assignment/update-assignment/${editAssignment._id}`,
          formData
        );
        showToast('Assignment updated successfully!', 'success');
      } else {
        await apiClient.post(
          '/assignment/assignment-create',
          formData
        );
        showToast('Assignment created successfully!', 'success');
      }
      setEditAssignment(null);
      fetchAssignments();
    } catch (err) {
      console.error('Error saving assignment:', err);
      const msg = err.response?.data?.message || 'Failed to save assignment';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      await apiClient.delete(
        `/assignment/delete-assignment/${assignmentToDelete._id}`
      );
      showToast('Assignment deleted successfully!', 'success');
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      fetchAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      showToast('Failed to delete assignment', 'error');
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const openView   = (a) => { setSelectedAssignment(a);  setShowDetailsDrawer(true); };
  const openEdit   = (a) => { setEditAssignment(a);       setShowAddModal(true); };
  const openDelete = (a) => { setAssignmentToDelete(a);   setShowDeleteModal(true); };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRouteFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || routeFilter !== 'all';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="-m-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center text-xs text-gray-400 mb-3 gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Dashboard</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-indigo-600 font-medium">Assignments</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                </div>
                Assignments
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor bus, driver and route assignments
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditAssignment(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Assignment
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => <AssignmentSkeletonLoader key={i} type="stat" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <StatCard title="Total Assignments" value={stats.total}    icon="bus"   color="indigo"  trend="" />
            <StatCard title="Active"             value={stats.active}   icon="check" color="emerald" trend="" />
            <StatCard title="Inactive"           value={stats.inactive} icon="times" color="gray"    trend="" />
            <StatCard title="Buses Assigned"     value={stats.buses}    icon="bus"   color="amber"   trend="" />
          </div>
        )}

        {/* ── Search & Filter ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search by bus, driver or route…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-gray-50"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Route filter */}
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Routes</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeName || r.name}{r.routeCode ? ` (${r.routeCode})` : ''}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchAssignments}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Active filter pills */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2"
              >
                <span className="text-xs text-gray-400 font-medium">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                    "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    {statusFilter}
                    <button onClick={() => setStatusFilter('all')}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Results count ────────────────────────────────────────────────── */}
        {!loading && assignments.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-800">{filteredAssignments.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-800">{assignments.length}</span>
              {' '}assignments
            </p>
          </div>
        )}

        {/* ── Assignment Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <AssignmentSkeletonLoader key={i} type="card" />)}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <AssignmentEmptyState onAdd={() => { setEditAssignment(null); setShowAddModal(true); }} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredAssignments.map((assignment, index) => (
              <AssignmentCard
                key={assignment._id || index}
                assignment={assignment}
                index={index}
                onView={() => openView(assignment)}
                onEdit={() => openEdit(assignment)}
                onDelete={() => openDelete(assignment)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modals & Drawer ──────────────────────────────────────────────── */}
      <AddAssignmentModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditAssignment(null); }}
        onSubmit={handleCreateAssignment}
        editAssignment={editAssignment}
        buses={buses}
        drivers={drivers}
        routes={routes}
      />

      <AssignmentDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => { setShowDetailsDrawer(false); setSelectedAssignment(null); }}
        assignment={selectedAssignment}
        onEdit={(a) => { openEdit(a); }}
      />

      <DeleteAssignmentConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setAssignmentToDelete(null); }}
        onConfirm={handleDeleteAssignment}
        assignment={assignmentToDelete}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default AssignmentManagement;

// Made with Bob
