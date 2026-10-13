import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  Database,
  Radio,
  CheckCircle2,
  Save,
  HelpCircle,
  Building2,
  Clock,
  MapPin,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import AdminSectionCard from '../../components/ui/AdminSectionCard';
import FormInput from '../../components/ui/FormInput';
import SelectInput from '../../components/ui/SelectInput';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';

const SettingsPage = () => {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Operational settings state (UI preferences)
  const [settings, setSettings] = useState({
    institutionName: 'UniTrack University Campus',
    timezone: 'Asia/Kolkata (IST +05:30)',
    contactEmail: 'transport-admin@unitrack.edu',
    gpsPollingRate: '5',
    staleThreshold: '60',
    defaultCenter: 'Surat, Gujarat [21.1702, 72.8311]',
    seatAssignmentPolicy: 'sequential',
    autoRefreshDashboard: 'true',
  });

  const handleChange = (field, val) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast('System preferences saved successfully', 'success');
    }, 400);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="System Settings"
        description="Configure university transit preferences, telemetry monitoring parameters, and system defaults"
        breadcrumb="Admin"
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Preferences</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: University Transit Profile */}
          <AdminSectionCard
            title="University Transit Profile"
            subtitle="Campus identity and contact metadata displayed across portals"
          >
            <div className="space-y-4">
              <FormInput
                label="Institution Name"
                value={settings.institutionName}
                onChange={(e) => handleChange('institutionName', e.target.value)}
                placeholder="e.g. UniTrack University"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectInput
                  label="Operations Timezone"
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  options={[
                    { value: 'Asia/Kolkata (IST +05:30)', label: 'Asia/Kolkata (IST +05:30)' },
                    { value: 'UTC', label: 'Universal Time (UTC)' },
                  ]}
                />
                <FormInput
                  label="Administrative Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="admin@unitrack.edu"
                />
              </div>
            </div>
          </AdminSectionCard>

          {/* Section 2: Telemetry & Monitoring Parameters */}
          <AdminSectionCard
            title="Telemetry & Monitoring Parameters"
            subtitle="GPS polling frequencies, freshness thresholds and map configurations"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectInput
                  label="Live GPS Polling Interval"
                  value={settings.gpsPollingRate}
                  onChange={(e) => handleChange('gpsPollingRate', e.target.value)}
                  options={[
                    { value: '3', label: 'Every 3 seconds (High frequency)' },
                    { value: '5', label: 'Every 5 seconds (Recommended)' },
                    { value: '10', label: 'Every 10 seconds (Low bandwidth)' },
                  ]}
                  hint="Frequency for Live Tracking map refresh"
                />
                <SelectInput
                  label="Stale Signal Threshold"
                  value={settings.staleThreshold}
                  onChange={(e) => handleChange('staleThreshold', e.target.value)}
                  options={[
                    { value: '30', label: '30 seconds' },
                    { value: '60', label: '60 seconds (Standard)' },
                    { value: '120', label: '120 seconds' },
                  ]}
                  hint="Marks bus as stale if no telemetry received"
                />
              </div>

              <FormInput
                label="Default Map Center & Coordinates"
                value={settings.defaultCenter}
                onChange={(e) => handleChange('defaultCenter', e.target.value)}
                hint="Fallback coordinates when no active buses are transmitting"
              />
            </div>
          </AdminSectionCard>

          {/* Section 3: Transport Seating Policies */}
          <AdminSectionCard
            title="Transport & Seating Policies"
            subtitle="Operational rules for student applications and seat allocations"
          >
            <div className="space-y-4">
              <SelectInput
                label="Seat Number Assignment Strategy"
                value={settings.seatAssignmentPolicy}
                onChange={(e) => handleChange('seatAssignmentPolicy', e.target.value)}
                options={[
                  { value: 'sequential', label: 'Manual Positive Integer (Strict capacity check)' },
                  { value: 'auto', label: 'Automated lowest available seat' },
                ]}
                hint="Enforced during Transport Management student approvals"
              />
            </div>
          </AdminSectionCard>
        </div>

        {/* Right Col: System Health & Architecture */}
        <div className="space-y-6">
          {/* Platform Status */}
          <AdminSectionCard
            title="Platform Diagnostics"
            subtitle="Core operational subsystems status"
            bodyClassName="p-4 space-y-3"
          >
            {[
              { label: 'REST API Gateway', status: 'Online', badge: 'Active' },
              { label: 'Database Cluster', status: 'MongoDB Connected', badge: 'Active' },
              { label: 'Role Authorization', status: 'JWT Admin Enforced', badge: 'Approved' },
              { label: 'Leaflet Map Tile CDN', status: 'OpenStreetMap Live', badge: 'Live' },
              { label: 'OSRM Route Geometry', status: 'Routing Engine Active', badge: 'Live' },
            ].map((diag) => (
              <div
                key={diag.label}
                className="flex items-center justify-between p-3 bg-gray-50/70 border border-gray-200/80 rounded-xl"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900">{diag.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{diag.status}</p>
                </div>
                <StatusBadge status={diag.badge} size="xs" />
              </div>
            ))}
          </AdminSectionCard>

          {/* Architecture Overview */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-5 text-purple-900 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Security &amp; Permissions</span>
            </h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              The UniTrack Admin portal enforces strict role-based access control. All administrative actions (vehicle registration, driver management, route modifications, and timetable changes) require authenticated session tokens with <strong>Admin</strong> privileges.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/80 p-4 text-xs text-gray-500 text-center font-medium">
            UniTrack Operations Portal · Version 2.4.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
