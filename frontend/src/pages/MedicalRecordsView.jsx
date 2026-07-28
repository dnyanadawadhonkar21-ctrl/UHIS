import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UnifiedMedicalTimeline from '../components/UnifiedMedicalTimeline';
import { FileText, Activity } from 'lucide-react';

const MedicalRecordsView = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients/timeline');
      if (res.data.success) {
        setTimeline(res.data.timeline);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Activity className="w-6 h-6 text-cyan-400 animate-spin" /> Loading Centralized Medical Timeline...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-cyan-400" /> Centralized Patient Medical Timeline
        </h2>
        <p className="text-xs text-slate-400">Unified historical repository of consultations, prescriptions, diagnostic lab reports & vaccinations</p>
      </div>

      <UnifiedMedicalTimeline events={timeline} />
    </div>
  );
};

export default MedicalRecordsView;
