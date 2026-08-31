import React from 'react';

const InformationOptionCard = ({ icon: Icon, title, description, isSelected, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 
        ${isSelected 
          ? 'bg-brand-50 border-brand-500 shadow-md shadow-brand-500/10' 
          : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm'
        }`}
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-bold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
          {title}
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {description}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center justify-center pt-1">
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
          ${isSelected ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}
        `}>
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformationOptionCard;
