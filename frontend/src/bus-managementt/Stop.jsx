import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from './components/StatCard';
import Toast from './components/Toast';
import StopCard from './stop-components/StopCard';
import AddStopModal from './stop-components/AddStopModal';
import StopDetailsDrawer from './stop-components/StopDetailsDrawer';
import DeleteStopConfirmModal from './stop-components/DeleteStopConfirmModal';
import StopSkeletonLoader from './stop-components/StopSkeletonLoader';
import StopEmptyState from './stop-components/StopEmptyState';

const Stop = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [stops, setStops] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedStop, setSelectedStop] = useState(null);
  const [stopToDelete, setStopToDelete] = useState(null);
  const [deleteDependencies, setDeleteDependencies] = useState(null);
  const [editStop, setEditStop] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [stats, setStats] = useState({ total: 0 });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const calculateStats = (data) => {
    setStats({ total: data.length });
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchStops = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/stop/get-all-stops');
      const data = res.data.data || [];
      setStops(data);
      setFilteredStops(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching stops:', err);
      showToast('Failed to fetch stops', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStops(); }, []);

  // ─── Filter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStops(stops);
      return;
    }
    setFilteredStops(
      stops.filter((s) =>
        s.stopName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, stops]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleAddStop = async (formData) => {
    try {
      if (editStop) {
        await apiClient.put(`/stop/update-stop/${editStop._id}`, formData);
        showToast('Stop updated successfully!', 'success');
      } else {
        await apiClient.post('/stop/stop-create', formData);
        showToast('Stop created successfully!', 'success');
      }
      setShowAddModal(false);
      setEditStop(null);
      fetchStops();
    } catch (err) {
      console.error('Error saving stop:', err);
      const msg = err.response?.data?.message || 'Failed to save stop';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteStop = async () => {
    if (deleteDependencies) return;
    try {
      await apiClient.delete(`/stop/delete-stop/${stopToDelete._id}`);
      showToast('Stop deleted successfully!', 'success');
      setShowDeleteModal(false);
      setStopToDelete(null);
      setDeleteDependencies(null);
      fetchStops();
    } catch (err) {
      console.error('Error deleting stop:', err);
      if (err.response?.status === 409) {
        setDeleteDependencies(err.response.data.dependencies || {});
        showToast(err.response.data.message || 'Stop is currently in use', 'error');
      } else {
        showToast(err.response?.data?.message || 'Failed to delete stop', 'error');
      }
    }
  };

  const openEdit = (stop) => {
    setEditStop(stop);
    setShowAddModal(true);
  };

  const openDelete = (stop) => {
    setStopToDelete(stop);
    const dependencies = stop.dependencies || {};
    setDeleteDependencies(
      dependencies.routes?.length || dependencies.studentsUsingStop ? dependencies : null
    );
    setShowDeleteModal(true);
  };

  const openView = (stop) => {
    setSelectedStop(stop);
    setShowDetailsDrawer(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40"
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
            <span className="text-blue-600 font-medium">Bus Stop Management</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                Bus Stop Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all university bus stops and coordinates
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditStop(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Stop
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Statistics Card ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-5 max-w-xs">
            <StopSkeletonLoader type="stat" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-5 max-w-xs">
            <StatCard
              title="Total Stops"
              value={stats.total}
              icon="bus"
              color="indigo"
              trend=""
            />
          </div>
        )}

        {/* ── Search ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search stops by name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchStops}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Active search pill */}
          <AnimatePresence>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100"
              >
                <span className="text-xs text-gray-500 font-medium">Filters:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Results Info ─────────────────────────────────────────────────── */}
        {!loading && stops.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{filteredStops.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{stops.length}</span> stops
            </p>
          </div>
        )}

        {/* ── Stop Grid ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <StopSkeletonLoader key={i} type="card" />)}
          </div>
        ) : filteredStops.length === 0 ? (
          <StopEmptyState onAddStop={() => { setEditStop(null); setShowAddModal(true); }} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredStops.map((stop, index) => (
              <StopCard
                key={stop._id || index}
                stop={stop}
                index={index}
                onView={() => openView(stop)}
                onEdit={() => openEdit(stop)}
                onDelete={() => openDelete(stop)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modals & Drawer ──────────────────────────────────────────────── */}
      <AddStopModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditStop(null); }}
        onSubmit={handleAddStop}
        editStop={editStop}
      />

      <StopDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => { setShowDetailsDrawer(false); setSelectedStop(null); }}
        stop={selectedStop}
        onEdit={(stop) => { setEditStop(stop); setShowAddModal(true); }}
      />

      <DeleteStopConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setStopToDelete(null); setDeleteDependencies(null); }}
        onConfirm={handleDeleteStop}
        stopName={stopToDelete?.stopName}
        dependencies={deleteDependencies}
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

export default Stop;

// Made with Bob
