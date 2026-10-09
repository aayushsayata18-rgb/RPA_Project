import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserPlus,
  Layers,
  BedDouble,
  LogOut,
  CreditCard,
  CheckCircle,
  FlaskConical,
  Radio,
  FileText,
  Edit3,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles
} from 'lucide-react';

export const PatientTimeline = ({ events = [], loading = false, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [expandedEventId, setExpandedEventId] = useState(null);

  const getEventIconAndColor = (type) => {
    switch (type) {
      case 'REGISTRATION':
        return { icon: UserPlus, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'OPD_VISIT':
        return { icon: Clock, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'APPOINTMENT':
        return { icon: Calendar, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' };
      case 'OPD_ENCOUNTER':
        return { icon: Layers, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' };
      case 'ADMISSION':
        return { icon: BedDouble, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' };
      case 'BED_ASSIGNMENT':
        return { icon: BedDouble, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' };
      case 'DISCHARGE':
        return { icon: LogOut, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' };
      case 'BILL_GENERATED':
        return { icon: CreditCard, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'PAYMENT':
        return { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' };
      case 'LAB_RESULT':
        return { icon: FlaskConical, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)' };
      case 'RADIOLOGY_REPORT':
        return { icon: Radio, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
      case 'PHARMACY_DISPENSE':
        return { icon: Sparkles, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)' };
      case 'DOCUMENT_GENERATED':
        return { icon: FileText, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
      case 'PROFILE_UPDATED':
        return { icon: Edit3, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
      default:
        return { icon: Tag, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sourceModule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedEventType === '' || e.eventType === selectedEventType;
    return matchesSearch && matchesType;
  });

  const eventTypes = [
    '',
    'REGISTRATION',
    'OPD_VISIT',
    'APPOINTMENT',
    'ADMISSION',
    'BED_ASSIGNMENT',
    'LAB_RESULT',
    'RADIOLOGY_REPORT',
    'PHARMACY_DISPENSE',
    'BILL_GENERATED',
    'PAYMENT',
    'DISCHARGE',
    'DOCUMENT_GENERATED',
    'PROFILE_UPDATED'
  ];

  return (
    <div
      style={{
        background: 'var(--bg-card, #1e293b)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}
    >
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
            Longitudinal Patient Timeline
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
            Chronological aggregation of all clinical encounters, services, billing, and documents
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Event Types</option>
            {eventTypes.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>
          Loading longitudinal timeline events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          No timeline events matching current filter criteria.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical Connecting Line */}
          <div
            style={{
              position: 'absolute',
              left: '19px',
              top: '10px',
              bottom: '20px',
              width: '2px',
              background: 'linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.1) 100%)'
            }}
          />

          {/* Event Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredEvents.map((event) => {
              const { icon: Icon, color, bg } = getEventIconAndColor(event.eventType);
              const isExpanded = expandedEventId === event.eventId;
              const dateStr = new Date(event.eventDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const timeStr = new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={event.eventId} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  {/* Node Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-2rem',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: bg,
                      border: `2px solid ${color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color,
                      boxShadow: `0 0 12px ${bg}`,
                      zIndex: 2
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Event Card */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '1rem',
                      transition: 'all 0.2s ease',
                      marginLeft: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: bg,
                              color: color,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              letterSpacing: '0.04em'
                            }}
                          >
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                            Source: {event.sourceModule.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 style={{ margin: '0.35rem 0 0.2rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary, #f8fafc)' }}>
                          {event.title}
                        </h4>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        <div style={{ fontWeight: '600' }}>{dateStr}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{timeStr}</div>
                      </div>
                    </div>

                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: '1.4' }}>
                      {event.summary}
                    </p>

                    {/* Expand metadata trigger */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div style={{ marginTop: '0.6rem' }}>
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : event.eventId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span>{isExpanded ? 'Hide Details' : 'View Meta Attributes'}</span>
                        </button>

                        {isExpanded && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: '#cbd5e1',
                              overflowX: 'auto'
                            }}
                          >
                            <pre style={{ margin: 0 }}>{JSON.stringify(event.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTimeline;
