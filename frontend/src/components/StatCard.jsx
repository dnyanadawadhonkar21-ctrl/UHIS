import React from 'react';

const COLOR_MAP = {
  emerald: {
    bg: 'var(--color-signal-normal-bg)',
    color: 'var(--color-signal-normal)',
    border: 'var(--color-signal-normal-border)',
  },
  rose: {
    bg: 'var(--color-signal-critical-bg)',
    color: 'var(--color-signal-critical)',
    border: 'var(--color-signal-critical-border)',
  },
  amber: {
    bg: 'var(--color-signal-warning-bg)',
    color: 'var(--color-signal-warning)',
    border: 'var(--color-signal-warning-border)',
  },
  purple: {
    bg: 'var(--color-signal-purple-bg)',
    color: 'var(--color-signal-purple)',
    border: 'var(--color-signal-purple-border)',
  },
  default: {
    bg: 'var(--color-accent-soft)',
    color: 'var(--color-accent-primary)',
    border: 'var(--color-accent-border)',
  },
};

const StatCard = ({ title, value, icon: Icon, change, subtext, color = 'default' }) => {
  const scheme = COLOR_MAP[color] || COLOR_MAP.default;

  return (
    <div
      className="instrument-panel fade-in"
      style={{
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span className="type-label" style={{ color: 'var(--color-ink-muted)' }}>
          {title}
        </span>
        <span className="type-stat" style={{ color: 'var(--color-ink)', marginTop: '2px' }}>
          {value}
        </span>
        {subtext && (
          <span className="type-micro" style={{ color: 'var(--color-ink-secondary)', marginTop: '2px' }}>
            {subtext}
          </span>
        )}
      </div>

      {Icon && (
        <div
          style={{
            padding: '0.625rem',
            borderRadius: '6px',
            background: scheme.bg,
            color: scheme.color,
            border: `1px solid ${scheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
