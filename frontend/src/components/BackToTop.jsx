import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top of page"
      className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white shadow-lg border border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:scale-105 active:scale-95"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export default BackToTop;
