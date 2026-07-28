import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 space-y-4">
      <AlertTriangle className="w-16 h-16 text-cyan-400" />
      <h2 className="text-3xl font-black text-white">404 - Resource Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md">
        The requested page or endpoint does not exist on the UHIS platform.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
      >
        <Home className="w-4 h-4" /> Return to UHIS Portal
      </Link>
    </div>
  );
};

export default NotFound;
