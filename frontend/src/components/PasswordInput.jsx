import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  className = '',
  id,
  ariaLabel = 'Password',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex items-center">
      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        name={name}
        required={required}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-brand-500 dark:focus:ring-cyan-500 transition ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded-md transition"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default PasswordInput;
