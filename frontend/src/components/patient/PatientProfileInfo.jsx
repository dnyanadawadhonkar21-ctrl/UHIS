import React, { useState } from 'react';
import {
  User,
  ChevronDown,
  ChevronUp,
  Droplet,
  Ruler,
  Weight,
  MapPin,
  Phone,
  HeartPulse,
  Calendar,
  Fingerprint,
  Activity,
  Edit3,
  Mail,
} from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import { SkeletonProfile } from '../SkeletonLoader';

const PatientProfileInfo = ({ profile, fetchProfile, loading, isOpen, onToggle }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const sectionOpen = isOpen !== undefined ? isOpen : localOpen;
  const handleToggle = onToggle || (() => setLocalOpen(!localOpen));

  if (loading) return <SkeletonProfile />;
  if (!profile) return null;

  // Compute age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  };

  const age = calculateAge(profile.dateOfBirth);
  const fullName = profile.user?.fullName || profile.fullName || 'N/A';
  const email = profile.user?.email || profile.email || 'N/A';
  const mobile = profile.user?.phoneNumber || profile.phoneNumber || profile.mobile || 'N/A';
  const emergencyStr = profile.emergencyContact
    ? `${profile.emergencyContact}${profile.emergencyPhone ? ` (${profile.emergencyPhone})` : ''}`
    : 'N/A';

  const profileDetails = [
    { label: 'Full Name', value: fullName, icon: User },
    { label: 'UHIS ID', value: profile.abhaId || 'UHIS-8244-9075', icon: Fingerprint },
    { label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : 'N/A', icon: Calendar },
    { label: 'Age', value: `${age} Years`, icon: Activity },
    { label: 'Gender', value: profile.gender || 'N/A', icon: User },
    { label: 'Blood Group', value: profile.bloodGroup || 'N/A', icon: Droplet },
    { label: 'Height', value: profile.height ? `${profile.height} cm` : 'N/A', icon: Ruler },
    { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : 'N/A', icon: Weight },
    { label: 'Mobile Number', value: mobile, icon: Phone },
    { label: 'Email ID', value: email, icon: Mail },
    { label: 'Emergency Contact', value: emergencyStr, icon: Phone },
    { label: 'Primary Physician', value: profile.primaryCarePhysician || 'Dr. Rajesh Sharma (General Medicine)', icon: HeartPulse },
    { label: 'Address', value: profile.address || 'N/A', icon: MapPin, fullWidth: true },
  ];

  return (
    <div id="section-profile" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={sectionOpen}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal & Contact Information</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Demographic, biometrics & emergency contact records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
          {sectionOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {sectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profileDetails.map((detail, idx) => {
              const Icon = detail.icon;
              return (
                <div
                  key={idx}
                  className={`space-y-1 ${detail.fullWidth ? 'sm:col-span-2 md:col-span-3' : ''}`}
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {detail.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{detail.value || '—'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={fetchProfile || (() => window.location.reload())}
        />
      )}
    </div>
  );
};

export default PatientProfileInfo;
