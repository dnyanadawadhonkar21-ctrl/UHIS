import React, { useState } from 'react';
import { X, Save, Lock, MapPin, Phone, Ruler, Weight, Droplet } from 'lucide-react';
import api from '../../services/api';

const EditProfileModal = ({ profile, onClose, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  
  const [formData, setFormData] = useState({
    address: profile.address || '',
    phoneNumber: profile.user?.phoneNumber || profile.phoneNumber || '',
    height: profile.height || '',
    weight: profile.weight || '',
    emergencyContact: profile.emergencyContact || '',
    emergencyPhone: profile.emergencyPhone || '',
    bloodGroup: profile.bloodGroup || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/patient/profile', formData);
      if (res.data.success) {
        setSuccess('Profile updated successfully.');
        setTimeout(() => {
          onProfileUpdated();
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError('New passwords do not match.');
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.data.success) {
        setSuccess('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Manage Profile</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 border-b border-slate-800">
          <button 
            onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }} 
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            Personal Info
          </button>
          <button 
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }} 
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${activeTab === 'password' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            Security
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {error && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">{success}</div>}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input type="text" name="height" value={formData.height} onChange={handleProfileChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input type="text" name="weight" value={formData.weight} onChange={handleProfileChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Blood Group</label>
                <div className="relative">
                  <Droplet className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleProfileChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none">
                    <option value="">Select...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleProfileChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="text" name="address" value={formData.address} onChange={handleProfileChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Emergency Name</label>
                  <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleProfileChange} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Emergency Phone</label>
                  <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleProfileChange} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="password" name="currentPassword" required value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs text-slate-400 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="password" name="newPassword" required value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="password" name="confirmPassword" required value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition disabled:opacity-50">
                <Lock className="w-4 h-4" /> Update Password
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;
