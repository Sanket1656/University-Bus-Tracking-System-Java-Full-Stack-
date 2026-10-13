import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../pages/admin/components/AdminSidebar';
import StatCard from './components/StatCard';
import BusCard from './components/BusCard';
import AddBusModal from './components/AddBusModal';
import BusDetailsDrawer from './components/BusDetailsDrawer';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';
import SkeletonLoader from './components/SkeletonLoader';
import EmptyState from './components/EmptyState';
import { Outlet } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Bus = () => {
  // State Management
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busToDelete, setBusToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0
  });

  // Fetch Buses
  const fetchBuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/bus/get-all-buses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      }); 
      const busData = response.data.data || [];
      setBuses(busData);
      setFilteredBuses(busData);
      calculateStats(busData);
    } catch (error) {
      console.error("Error fetching buses:", error);
      showToast('Failed to fetch buses', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Statistics
  const calculateStats = (busData) => {
    setStats({
      total: busData.length,
      active: busData.filter(b => b.busStatus === 'active').length,
      inactive: busData.filter(b => b.busStatus === 'inactive').length,
      maintenance: busData.filter(b => b.busStatus === 'maintenance').length
    });
  };

  // Filter Buses
  useEffect(() => {
    let filtered = [...buses];

    if (searchTerm) {
      filtered = filtered.filter(bus =>
        bus.busName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.busRegistrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.busStatus === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(bus => bus.busType === typeFilter);
    }

    if (capacityFilter !== 'all') {
      if (capacityFilter === 'small') {
        filtered = filtered.filter(bus => bus.busCapacity <= 30);
      } else if (capacityFilter === 'medium') {
        filtered = filtered.filter(bus => bus.busCapacity > 30 && bus.busCapacity <= 50);
      } else if (capacityFilter === 'large') {
        filtered = filtered.filter(bus => bus.busCapacity > 50);
      }
    }

    setFilteredBuses(filtered);
  }, [searchTerm, statusFilter, typeFilter, capacityFilter, buses]);

  // Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Handle Add Bus
  const handleAddBus = async (formData) => {
    try {
      const data = new FormData();
      for (let key in formData) {
        data.append(key, formData[key]);
      }

      const response = await axios.post(`${API_BASE}/bus/bus-create`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      setBuses(prev => [...prev, response.data]);
      setShowAddModal(false);
      showToast('Bus added successfully!', 'success');
      fetchBuses();
    } catch (error) {
      console.error("Error creating bus:", error);
      showToast('Failed to add bus', 'error');
      throw error;
    }
  };

  // Handle Delete Bus
  const handleDeleteBus = async () => {
    try {
      await axios.delete(`${API_BASE}/bus/delete-bus/${busToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      setBuses(prev => prev.filter(bus => bus._id !== busToDelete._id));
      setShowDeleteModal(false);
      setBusToDelete(null);
      showToast('Bus deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting bus:", error);
      showToast('Failed to delete bus', 'error');
    }
  };

  // Clear Filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCapacityFilter('all');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Bus Name', 'Bus Number', 'Registration', 'Type', 'Capacity', 'Status'];
    const csvData = filteredBuses.map(bus => [
      bus.busName,
      bus.busNumber,
      bus.busRegistrationNumber,
      bus.busType,
      bus.busCapacity,
      bus.busStatus
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV exported successfully!', 'success');
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  return (
    <div className="flex">
      <div className="flex-1 min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-white/90"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Dashboard</span>
            <svg className="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-indigo-600 font-medium">Bus Management</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                </div>
                Bus Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all university buses, capacity, status, routes and assignments
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Bus
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} type="stat" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Buses"
              value={stats.total}
              icon="bus"
              color="indigo"
              trend="+12%"
            />
            <StatCard
              title="Active Buses"
              value={stats.active}
              icon="check"
              color="emerald"
              trend="+8%"
            />
            <StatCard
              title="Inactive Buses"
              value={stats.inactive}
              icon="times"
              color="gray"
              trend="-3%"
            />
            <StatCard
              title="Maintenance"
              value={stats.maintenance}
              icon="warning"
              color="amber"
              trend="+2%"
            />
          </div>
        )}

        {/* Search & Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search by bus name, number, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filters
              <svg className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Action Buttons */}
            <button
              onClick={fetchBuses}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="Ac">AC</option>
                      <option value="Non-Ac">Non-AC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity Range</label>
                    <select
                      value={capacityFilter}
                      onChange={(e) => setCapacityFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Capacities</option>
                      <option value="small">Small (≤30)</option>
                      <option value="medium">Medium (31-50)</option>
                      <option value="large">Large ({'>'}50)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bus List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLoader key={i} type="card" />)}
          </div>
        ) : filteredBuses.length === 0 ? (
          <EmptyState onAddBus={() => setShowAddModal(true)} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBuses.map((bus, index) => (
              <BusCard
                key={bus._id || index}
                bus={bus}
                onView={() => {
                  setSelectedBus(bus);
                  setShowDetailsDrawer(true);
                }}
                onEdit={() => {
                  setSelectedBus(bus);
                  setShowAddModal(true);
                }}
                onDelete={() => {
                  setBusToDelete(bus);
                  setShowDeleteModal(true);
                }}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Modals and Drawers */}
      <AddBusModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedBus(null);
        }}
        onSubmit={handleAddBus}
        editBus={selectedBus}
      />

      <BusDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedBus(null);
        }}
        bus={selectedBus}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBusToDelete(null);
        }}
        onConfirm={handleDeleteBus}
        busName={busToDelete?.busName}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
      </div>
    </div>
  );
};

export default Bus;

// Made with Bob
