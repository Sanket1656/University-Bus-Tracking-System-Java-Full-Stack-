import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from './components/StatCard';
import Toast from './components/Toast';
import RouteCard from './route-components/RouteCard';
import AddRouteModal from './route-components/AddRouteModal';
import RouteDetailsDrawer from './route-components/RouteDetailsDrawer';
import DeleteRouteConfirmModal from './route-components/DeleteRouteConfirmModal';
import RouteSkeletonLoader from './route-components/RouteSkeletonLoader';
import RouteEmptyState from './route-components/RouteEmptyState';

const RouteManagement = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [routes, setRoutes]               = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [stops, setStops]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');

  const [showAddModal, setShowAddModal]         = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [editRoute, setEditRoute]         = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [stats, setStats] = useState({ total: 0, totalStops: 0 });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const calculateStats = (data) => {
    const totalStops = data.reduce((sum, r) => sum + (r.stops?.length || 0), 0);
    setStats({ total: data.length, totalStops });
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res  = await apiClient.get('/routes/get-all-routes');
      const data = res.data.data || [];
      setRoutes(data);
      setFilteredRoutes(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching routes:', err);
      showToast('Failed to fetch routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async () => {
    try {
      const res  = await apiClient.get('/stop/get-all-stops');
      setStops(res.data.data || []);
    } catch (err) {
      console.error('Error fetching stops:', err);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchStops();
  }, []);

  // ─── Filter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRoutes(routes);
      return;
    }
    setFilteredRoutes(
      routes.filter(
        (r) =>
          r.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.routeCode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, routes]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleAddRoute = async (formData) => {
    try {
      if (editRoute) {
        await apiClient.put(`/routes/update-route/${editRoute._id}`, formData);
        showToast('Route updated successfully!', 'success');
      } else {
        await apiClient.post('/routes/route-create', formData);
        showToast('Route created successfully!', 'success');
      }
      setShowAddModal(false);
      setEditRoute(null);
      fetchRoutes();
    } catch (err) {
      console.error('Error saving route:', err);
      const msg = err.response?.data?.message || 'Failed to save route';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteRoute = async () => {
    try {
      await apiClient.delete(`/routes/delete-route/${routeToDelete._id}`);
      showToast('Route deleted successfully!', 'success');
      setShowDeleteModal(false);
      setRouteToDelete(null);
      fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
      showToast('Failed to delete route', 'error');
    }
  };

  const openEdit = (route) => {
    setEditRoute(route);
    setShowAddModal(true);
  };

  const openDelete = (route) => {
    setRouteToDelete(route);
    setShowDeleteModal(true);
  };

  const openView = (route) => {
    setSelectedRoute(route);
    setShowDetailsDrawer(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 overflow-y-auto">

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
            <span className="text-violet-600 font-medium">Route Management</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                </div>
                Route Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all university bus routes and stops
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditRoute(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Route
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Statistics Cards ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map((i) => <RouteSkeletonLoader key={i} type="stat" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatCard title="Total Routes"     value={stats.total}      icon="bus"   color="indigo"  trend="" />
            <StatCard title="Total Stops Used" value={stats.totalStops} icon="check" color="emerald" trend="" />
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
                placeholder="Search by route name or code…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
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
              onClick={fetchRoutes}
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
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
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
        {!loading && routes.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{filteredRoutes.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{routes.length}</span> routes
            </p>
          </div>
        )}

        {/* ── Route Grid ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <RouteSkeletonLoader key={i} type="card" />)}
          </div>
        ) : filteredRoutes.length === 0 ? (
          <RouteEmptyState onAddRoute={() => { setEditRoute(null); setShowAddModal(true); }} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredRoutes.map((route, index) => (
              <RouteCard
                key={route._id || index}
                route={route}
                index={index}
                onView={() => openView(route)}
                onEdit={() => openEdit(route)}
                onDelete={() => openDelete(route)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modals & Drawer ──────────────────────────────────────────────── */}
      <AddRouteModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditRoute(null); }}
        onSubmit={handleAddRoute}
        editRoute={editRoute}
        stops={stops}
      />

      <RouteDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => { setShowDetailsDrawer(false); setSelectedRoute(null); }}
        route={selectedRoute}
        onEdit={(route) => { setEditRoute(route); setShowAddModal(true); }}
      />

      <DeleteRouteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setRouteToDelete(null); }}
        onConfirm={handleDeleteRoute}
        routeName={routeToDelete?.routeName}
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

export default RouteManagement;

// Made with Bob
