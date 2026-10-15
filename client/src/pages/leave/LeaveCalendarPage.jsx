import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Search
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeaveCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedType]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const [reqRes, typeRes] = await Promise.all([
        leaveService.getLeaveRequests({
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          leaveTypeId: selectedType || undefined,
          status: ['APPROVED', 'PENDING']
        }),
        leaveService.getLeaveTypes({ status: 'ACTIVE' })
      ]);

      setLeaveRequests(reqRes.data?.requests || []);
      setLeaveTypes(typeRes.data?.leaveTypes || []);
    } catch (err) {
      console.error('Failed to load leave calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredRequests = leaveRequests.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.employeeName?.toLowerCase().includes(term) ||
      r.employeeCode?.toLowerCase().includes(term) ||
      r.departmentName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Hospital Leave Calendar
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Departmental and staff leave schedules to prevent coverage shortages across wards.
          </p>
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <button onClick={prevMonth} className="btn btn-sm btn-secondary" style={{ padding: '0.35rem' }}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: '600', fontSize: '1.1rem', minWidth: '150px', textAlign: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="btn btn-sm btn-secondary" style={{ padding: '0.35rem' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by staff name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select
            className="form-control"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} style={{ minHeight: '90px', background: 'var(--bg-secondary)', opacity: 0.3, borderRadius: 'var(--radius-sm)' }} />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const targetDate = new Date(year, month, dayNum);

            const dayLeaves = filteredRequests.filter(r => {
              const s = new Date(r.startDate);
              const e = new Date(r.endDate);
              s.setHours(0, 0, 0, 0);
              e.setHours(23, 59, 59, 999);
              return targetDate >= s && targetDate <= e;
            });

            const isToday = new Date().toDateString() === targetDate.toDateString();

            return (
              <div
                key={`day-${dayNum}`}
                style={{
                  minHeight: '90px',
                  background: isToday ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-secondary)',
                  border: isToday ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: isToday ? '700' : '500', color: isToday ? '#38bdf8' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {dayNum}
                  </span>
                  {dayLeaves.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dayLeaves.length} on leave</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '60px' }}>
                  {dayLeaves.map(leave => (
                    <div
                      key={leave._id}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.35rem',
                        borderRadius: '3px',
                        background: leave.status === 'APPROVED' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: leave.status === 'APPROVED' ? '#4ade80' : '#f59e0b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`${leave.employeeName} (${leave.leaveTypeCode})`}
                    >
                      {leave.employeeName?.split(' ')[0] || leave.employeeCode} ({leave.leaveTypeCode})
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendarPage;
