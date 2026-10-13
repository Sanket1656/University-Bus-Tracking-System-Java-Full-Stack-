import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Edit2, Camera, Shield, FileText, 
  Map, Calendar, Save, X, Navigation, CheckCircle, Upload
} from 'lucide-react';
import driverApi from '../api/driverApi';
import { resolveMediaUrl } from '../utils/mediaUtils';

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [previewImages, setPreviewImages] = useState({ photo: null, licensePhoto: null });

  const [formData, setFormData] = useState({
    photo: null,
    name: "",
    email: "",
    phone: "",
    licenseId: "",
    licensePhoto: null,
    age: "",
    address: "",
    area: "",
    landmark: "",
  });

  useEffect(() => {
    driverApi.getProfile()
      .then(res => {
        if (res.data?.exists) {
          setProfile(res.data.data);
        } else {
          setIsNew(true);
        }
      })
      .catch(err => console.log(err));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        [e.target.name]: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => ({ ...prev, [e.target.name]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key]);
      }
    }

    driverApi.create(data)
      .then(res => {
        setProfile(res.data?.data || res.data);
        setIsNew(false);
      })
      .catch(err => console.log(err));
  };

  const handleEdit = () => {
    setIsEdit(true);
    setFormData({
      photo: null,
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      licenseId: profile?.licenseId || "",
      licensePhoto: null,
      age: profile?.age || "",
      address: profile?.address || "",
      area: profile?.area || "",
      landmark: profile?.landmark || "",
    });
    setPreviewImages({
      photo: resolveMediaUrl(profile?.photo) || null,
      licensePhoto: resolveMediaUrl(profile?.licensePhoto) || null
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const data = new FormData();
    for(let key in formData){
      if(formData[key] !== null && formData[key] !== ""){
        data.append(key, formData[key]);
      }
    }

    driverApi.update(data)
      .then(res => {
        setProfile(res.data?.data || res.data);
        setIsEdit(false);
        alert("Profile updated Successfully");
      })
      .catch(err => console.log(err));
  };

  const renderForm = (onSubmit, title, buttonText, onCancel = null) => (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="px-8 py-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{title}</h2>
              <p className="text-blue-100">Complete your driver profile to get verified</p>
            </div>
            {onCancel && (
              <button type="button" onClick={onCancel} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm">
                <X className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="35" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              License Details
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Driving License ID *</label>
              <input type="text" name="licenseId" value={formData.licenseId} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="DL-2023-XXXXX" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              Contact & Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="driver@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="+91 98765 43210" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address *</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none" placeholder="123 Main Street, Apt 4B..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area / Locality *</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="Downtown" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nearest Landmark *</label>
                <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="Near Central Mall" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              Documents & Photos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-all relative overflow-hidden group">
                  {previewImages.photo ? (
                    <img src={previewImages.photo} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                    </div>
                  )}
                  <input type="file" name="photo" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Driving License Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-all relative overflow-hidden group">
                  {previewImages.licensePhoto ? (
                    <img src={previewImages.licensePhoto} alt="License Preview" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Upload License Image</p>
                    </div>
                  )}
                  <input type="file" name="licensePhoto" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
            {onCancel && (
              <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all">
                Cancel
              </button>
            )}
            <button type="submit" className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 transform hover:scale-105">
              <Save className="w-5 h-5" />
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isEdit) return renderForm(handleUpdate, "Edit Profile", "Save Changes", () => setIsEdit(false));
  if (isNew) return renderForm(handleSubmit, "Create Profile", "Complete Registration");

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Profile Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-2xl p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center">
              {profile?.photo ? (
                <img src={resolveMediaUrl(profile.photo)} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <div className="text-center md:text-left flex-1 text-white">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-sm font-medium">Verified Driver</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{profile?.name}</h1>
            <p className="text-blue-100 text-lg flex items-center justify-center md:justify-start gap-2">
              <FileText className="w-5 h-5" /> License ID: <span className="font-semibold text-white tracking-wider">{profile?.licenseId}</span>
            </p>
          </div>

          <button onClick={handleEdit} className="shrink-0 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2 transform hover:scale-105">
            <Edit2 className="w-5 h-5" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              Contact Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 mb-1">Email Address</p>
                <p className="text-lg font-bold text-gray-800 break-words">{profile?.email}</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 mb-1">Phone Number</p>
                <p className="text-lg font-bold text-gray-800">{profile?.phone}</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 sm:col-span-2">
                <p className="text-sm font-semibold text-gray-500 mb-1">Age</p>
                <p className="text-lg font-bold text-gray-800">{profile?.age} Years</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              Location Details
            </h3>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 mb-2">Registered Address</p>
                <p className="text-lg font-medium text-gray-800">{profile?.address}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Map className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Area</p>
                    <p className="font-bold text-gray-800">{profile?.area}</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Navigation className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Landmark</p>
                    <p className="font-bold text-gray-800">{profile?.landmark}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 h-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              License Document
            </h3>
            
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group relative">
              {profile?.licensePhoto ? (
                <>
                  <img src={resolveMediaUrl(profile.licensePhoto)} alt="Driving License" className="w-full h-80 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button className="px-6 py-2 bg-white text-gray-900 font-bold rounded-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Camera className="w-4 h-4" /> View Full
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-80 flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-medium">No license document uploaded</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 font-medium">Your license document has been successfully verified by the administration team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;