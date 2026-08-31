import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const defaultFaqs = [
  {
    id: 1,
    question: 'How do I update my personal and contact information?',
    answer: 'Navigate to your Patient Medical Profile section on the Patient Dashboard, click the "Edit Profile" button, update your details (address, height, weight, emergency contact), and click "Save Changes".',
  },
  {
    id: 2,
    question: 'How can I view and download my laboratory reports?',
    answer: 'Under the "Laboratory Reports" card on your Patient Dashboard or Medical Timeline, click on any report to expand it, and click "View / Download PDF" to save a copy of your test results.',
  },
  {
    id: 3,
    question: 'Who can access my medical records in UHIS?',
    answer: 'Your health records are protected by ABHA privacy regulations. Only authorized healthcare professionals directly assigned to your care or hospitals you explicitly authorize can access your record timeline.',
  },
  {
    id: 4,
    question: 'How do I view my vaccination history?',
    answer: 'Your complete vaccination history is automatically cataloged in the "Vaccination History" section on your dashboard, showing vaccine names, administration dates, batch numbers, and due dates.',
  },
  {
    id: 5,
    question: 'How do I book an OPD consultation with a doctor?',
    answer: 'Click the "Book Doctor OPD" button at the top of your Patient Dashboard, select your physician, date, and preferred time slot, and submit the booking request.',
  },
];

const FAQAccordion = ({ faqs = defaultFaqs, title = 'Frequently Asked Help & Guidance' }) => {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <HelpCircle className="w-5 h-5 text-brand-600 dark:text-cyan-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(faq.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQAccordion;
