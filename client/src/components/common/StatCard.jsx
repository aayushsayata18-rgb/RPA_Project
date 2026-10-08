import React from 'react';

export const StatCard = ({ title, value, change, icon: Icon, color = '#0284c7' }) => {
  return (
    <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{title}</p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--text-primary)' }}>{value}</h3>
        {change && (
          <p style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.25rem', fontWeight: '600' }}>
            {change}
          </p>
        )}
      </div>
      {Icon && (
        <div style={{
          background: `${color}1a`,
          border: `1px solid ${color}33`,
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
