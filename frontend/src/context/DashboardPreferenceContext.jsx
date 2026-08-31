import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DashboardPreferenceContext = createContext();

// Default visible sections per role
export const DEFAULT_PREFERENCES = {
  PATIENT: {
    profile: true,
    alerts: true,
    badges: true,
    diseaseHistory: true,
    medications: true,
    labReports: true,
    allergies: true,
    vaccinations: true,
    timeline: true
  },
  DOCTOR: {
    appointments: true,
    metrics: true
  }
};

export const DashboardPreferenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user && user.id && user.role) {
      const storedPrefs = localStorage.getItem(`uhis_dashboard_prefs_${user.id}`);
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
      } else {
        // Initialize with default preferences for role
        const defaultForRole = DEFAULT_PREFERENCES[user.role] || {};
        setPreferences(defaultForRole);
        localStorage.setItem(`uhis_dashboard_prefs_${user.id}`, JSON.stringify(defaultForRole));
      }
      setIsLoaded(true);
    } else {
      setPreferences({});
      setIsLoaded(false);
    }
  }, [user]);

  const updatePreferences = (newPreferences) => {
    if (user && user.id) {
      setPreferences(newPreferences);
      localStorage.setItem(`uhis_dashboard_prefs_${user.id}`, JSON.stringify(newPreferences));
    }
  };

  const toggleSection = (sectionKey) => {
    const updated = { ...preferences, [sectionKey]: !preferences[sectionKey] };
    updatePreferences(updated);
  };

  return (
    <DashboardPreferenceContext.Provider value={{ preferences, updatePreferences, toggleSection, isLoaded }}>
      {children}
    </DashboardPreferenceContext.Provider>
  );
};

export const useDashboardPreferences = () => useContext(DashboardPreferenceContext);
