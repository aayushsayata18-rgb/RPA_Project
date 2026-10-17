import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Filter, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';

export const MaintenanceCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getCalendar({});
      setEvents(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthYearLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="maintenance-calendar-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-cyan-600" />
              Maintenance Calendar & Scheduled Roster
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Scheduled preventive maintenance, vendor visits, calibrations, and technician assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1 shadow-sm">
            <button onClick={prevMonth} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-800 px-3">{monthYearLabel}</span>
            <button onClick={nextMonth} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchCalendar}
            className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-gray-600 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events Agenda / Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Scheduled Maintenance Events ({events.length})
        </h3>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading scheduled events...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No maintenance events scheduled for this window.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/operations/maintenance/work-orders/${evt.id}`)}
                className="p-4 rounded-xl border border-gray-200 hover:border-cyan-400 hover:shadow transition-all cursor-pointer bg-gray-50/50 hover:bg-white space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                    {evt.workOrderId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    evt.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    evt.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {evt.priority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{evt.title}</h4>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(evt.start).toLocaleString()}</span>
                  </div>
                  {evt.technician && <div>Tech: <strong>{evt.technician}</strong></div>}
                  {evt.vendor && <div className="text-blue-600">Vendor: <strong>{evt.vendor}</strong></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceCalendar;
