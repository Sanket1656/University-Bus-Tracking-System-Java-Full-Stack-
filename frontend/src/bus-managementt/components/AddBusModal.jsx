import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaUtils';

const AddBusModal = ({ isOpen, onClose, onSubmit, editBus }) => {
  const [formData, setFormData] = useState({
    busName: '',
    busNumber: '',
    busRegistrationNumber: '',
    busType: 'Non-Ac',
    busCapacity: '',
    busStatus: 'active',
    busPhoto: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (editBus) {
      setFormData({
        busName: editBus.busName || '',
        busNumber: editBus.busNumber || '',
        busRegistrationNumber: editBus.busRegistrationNumber || '',
        busType: editBus.busType || 'Non-Ac',
        busCapacity: editBus.busCapacity || '',
        busStatus: editBus.busStatus || 'active',
        busPhoto: null,
      });
      if (editBus.busPhoto) {
        setImagePreview(resolveMediaUrl(editBus.busPhoto));
      }
    } else {
      resetForm();
    }
  }, [editBus, isOpen]);

  const resetForm = () => {
    setFormData({
      busName: '',
      busNumber: '',
      busRegistrationNumber: '',
      busType: 'Non-Ac',
      busCapacity: '',
      busStatus: 'active',
      busPhoto: null,
    });
    setImagePreview(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, busPhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({ ...prev, busPhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.busName.trim()) newErrors.busName = 'Bus name is required';
    if (!formData.busNumber.trim()) newErrors.busNumber = 'Bus number is required';
    if (!formData.busRegistrationNumber.trim()) newErrors.busRegistrationNumber = 'Registration number is required';
    if (!formData.busCapacity) newErrors.busCapacity = 'Capacity is required';
    if (formData.busCapacity < 1) newErrors.busCapacity = 'Capacity must be at least 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editBus ? 'Edit Bus' : 'Add New Bus'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editBus ? 'Update bus information' : 'Fill in the details to add a new bus'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Image
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, busPhoto: null }));
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className="mt-4">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-indigo-600 hover:text-indigo-500 font-medium">
                              Upload a file
                            </span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bus Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="busName"
                    value={formData.busName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.busName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., University Express"
                  />
                  {errors.busName && (
                    <p className="mt-1 text-sm text-red-500">{errors.busName}</p>
                  )}
                </div>

                {/* Bus Number & Registration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bus Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="busNumber"
                      value={formData.busNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.busNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., BUS-001"
                    />
                    {errors.busNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.busNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="busRegistrationNumber"
                      value={formData.busRegistrationNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.busRegistrationNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., ABC-1234"
                    />
                    {errors.busRegistrationNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.busRegistrationNumber}</p>
                    )}
                  </div>
                </div>

                {/* Bus Type & Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bus Type
                    </label>
                    <select
                      name="busType"
                      value={formData.busType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="Ac">AC</option>
                      <option value="Non-Ac">Non-AC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="busCapacity"
                      value={formData.busCapacity}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        errors.busCapacity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 50"
                    />
                    {errors.busCapacity && (
                      <p className="mt-1 text-sm text-red-500">{errors.busCapacity}</p>
                    )}
                  </div>
                </div>

                {/* Bus Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="busStatus"
                    value={formData.busStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>{editBus ? 'Update Bus' : 'Add Bus'}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AddBusModal;

// Made with Bob
