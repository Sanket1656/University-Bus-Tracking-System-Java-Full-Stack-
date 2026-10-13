import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bus,
  Camera,
  GraduationCap,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import studentApi from '../api/studentApi';
import transportRequestApi from '../api/transportRequestApi';
import { useToast } from '../context/ToastContext';
import { resolveMediaUrl } from '../utils/mediaUtils';

const imgUrl = resolveMediaUrl;

const emptyForm = {
  photo: '',
  name: '',
  branch: '',
  enrollmentNumber: '',
  email: '',
  phone: '',
  address: '',
  area: '',
  landmark: '',
};

const getInitials = (value) => {
  if (!value) return 'ST';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'ST';
};

const StudentProfile = () => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [transportSummary, setTransportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imgError, setImgError] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setProfileError('');
    setImgError(false);

    try {
      const { data } = await studentApi.getProfile();
      if (data && data.exists === false) {
        setProfile(null);
        setIsCreating(true);
        setPreview(null);
        return;
      }
      const actualProfile = data?.data ?? data ?? null;
      setProfile(actualProfile);
      setPreview(imgUrl(actualProfile?.photo));
      setIsCreating(false);
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        setProfile(null);
        setIsCreating(true);
        setPreview(null);
        return;
      }

      const message = error.response?.data?.message || 'Unable to load your profile.';
      setProfileError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchTransportSummary = useCallback(async () => {
    try {
      const { data } = await transportRequestApi.getMyTransportRequest();
      const request = data?.data ?? data ?? null;
      setTransportSummary(request);
    } catch (error) {
      if (error.response?.status !== 404) {
        setTransportSummary(null);
      } else {
        setTransportSummary(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchTransportSummary();
  }, [fetchProfile, fetchTransportSummary]);

  const beginEdit = () => {
    setFormData({
      photo: '',
      name: profile?.name || '',
      branch: profile?.branch || '',
      enrollmentNumber: profile?.enrollmentNumber || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      area: profile?.area || '',
      landmark: profile?.landmark || '',
    });
    setPreview(imgUrl(profile?.photo) || null);
    setImgError(false);
    if (!profile) {
      setIsCreating(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Please upload a valid JPG, PNG, or WEBP image.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('The selected image is too large. Maximum size is 5MB.', 'error');
      return;
    }

    setFormData((current) => ({ ...current, photo: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) payload.append(key, value);
    });

    try {
      const request = isCreating ? studentApi.create(payload) : studentApi.update(payload);
      const { data } = await request;
      const updatedProfile = data?.data ?? data ?? null;
      setProfile(updatedProfile);
      setPreview(imgUrl(updatedProfile?.photo));
      setImgError(false);
      setIsCreating(false);
      setIsEditing(false);
      setProfileError('');
      addToast(isCreating ? 'Profile created successfully.' : 'Profile updated successfully.', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Unable to save your profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const transportBus =
    transportSummary?.assignment?.bus?.busNumber ||
    transportSummary?.assignment?.bus?.busName ||
    'Not available';

  const transportRoute =
    transportSummary?.assignment?.route?.routeName ||
    transportSummary?.assignment?.route?.name ||
    'Not available';

  const transportStop =
    transportSummary?.preferredStop?.stopName ||
    transportSummary?.preferredStop?.name ||
    'Not available';

  const transportSeat = transportSummary?.seatNumber ?? 'Not available';
  const transportStatus = transportSummary?.status || 'Not available';

  if (profileError) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">Unable to load your profile.</h2>
          <p className="mt-2 text-sm text-slate-500">Please retry to refresh your profile information.</p>
          <button
            type="button"
            onClick={fetchProfile}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-8 w-40 rounded-xl bg-slate-100" />
          <div className="mt-3 h-4 w-72 rounded-lg bg-slate-100" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (isEditing || isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Student profile</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {isCreating ? 'Create your profile' : 'Edit profile'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setIsCreating(false);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <form onSubmit={submitProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400">
                {preview ? (
                  <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-slate-500">Upload a profile photo</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Enrollment ID</label>
              <input name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Branch</label>
              <input name="branch" value={formData.branch} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Mobile</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Area</label>
              <input name="area" value={formData.area} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Landmark</label>
              <input name="landmark" value={formData.landmark} onChange={handleChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" />
              {submitting ? 'Saving...' : isCreating ? 'Create profile' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <User className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">No profile found</h2>
          <p className="mt-2 text-sm text-slate-500">You haven't set up your student profile yet.</p>
          <button
            type="button"
            onClick={() => {
              setFormData(emptyForm);
              setPreview(null);
              setIsCreating(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <PencilLine className="h-4 w-4" />
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-2 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Student profile</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal and contact information</p>
        </div>

        <button
          type="button"
          onClick={beginEdit}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <PencilLine className="h-4 w-4" />
          Edit Profile
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-indigo-50 text-lg font-bold text-indigo-700">
              {profile?.photo && !imgError ? (
                <img
                  src={imgUrl(profile.photo)}
                  alt={profile?.name || 'Student avatar'}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                getInitials(profile?.name)
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{profile?.name || 'Not available'}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  {profile?.branch || 'Not available'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-500" />
                  {profile?.enrollmentNumber || 'Not available'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Role</p>
            <div className="mt-2 inline-flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Student
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.name || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Enrollment ID</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.enrollmentNumber || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Branch</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.branch || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Age</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.age ?? 'Not available'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Mail className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                  <p className="mt-2 break-all text-base font-semibold text-slate-900">{profile?.email || 'Not available'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Phone className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mobile Number</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{profile?.phone || 'Not available'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Address</h3>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Registered Address</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.address || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Area</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.area || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Landmark</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{profile?.landmark || 'Not available'}</p>
              </div>
            </div>
          </section>

          {transportSummary && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Bus className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Transport Summary</h3>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium">Transport Status</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{transportStatus}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium">Assigned Bus</span>
                  <span className="font-semibold text-slate-900">{transportBus}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium">Route</span>
                  <span className="font-semibold text-slate-900">{transportRoute}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium">Pickup Stop</span>
                  <span className="font-semibold text-slate-900">{transportStop}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium">Seat</span>
                  <span className="font-semibold text-slate-900">{transportSeat}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;