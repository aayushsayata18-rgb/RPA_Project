import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import admissionService from '../../services/admissionService';
import {
  Bed,
  CheckCircle2,
  Clock,
  Building,
  User,
  Activity,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const PatientAdmissionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await admissionService.getAdmissions({
        patientId: user?.patientId || 'P10001'
      });
      setAdmissions(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load admission records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const activeAdmission = admissions.find((a) => a.status === 'ADMITTED');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Patient Hero Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bed className="w-7 h-7 text-teal-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hospital Inpatient Stays</h1>
              <p className="text-teal-100 text-sm mt-0.5">
                View your current inpatient room assignment, attending care team, and admission slips.
              </p>
            </div>
          </div>
          <button
            onClick={fetchAdmissions}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all self-start md:self-auto"
          >
            Refresh Stays
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Current Active Inpatient Admission Highlight */}
      {activeAdmission ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Current Inpatient Stay</h2>
                <div className="text-xs text-slate-500">
                  Admission ID: <span className="font-mono font-bold text-emerald-800">{activeAdmission.admissionId}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase tracking-wider">
              ACTIVE INPATIENT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <div className="text-slate-400 font-medium">Room & Bed</div>
              <div className="text-base font-bold text-emerald-700">Bed {activeAdmission.assignedBedNumber}</div>
              <div className="text-slate-600">{activeAdmission.assignedWardName || activeAdmission.assignedWardId}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <div className="text-slate-400 font-medium">Attending Consultant</div>
              <div className="text-base font-bold text-slate-900">{activeAdmission.admittingDoctorName}</div>
              <div className="text-slate-600">{activeAdmission.admittingDepartmentName}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <div className="text-slate-400 font-medium">Admitted Date</div>
              <div className="text-base font-bold text-slate-900">{activeAdmission.admissionDateStr}</div>
              <div className="text-slate-600">{activeAdmission.admissionTime}</div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => navigate(`/operations/admissions/${activeAdmission.admissionId}`)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> View Official Admission Record
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No Current Active Inpatient Admission</h3>
          <p className="text-xs text-slate-500">You are not currently admitted to any hospital inpatient ward.</p>
        </div>
      )}

      {/* Past Admissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Hospital Admission History</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading records...</div>
        ) : admissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No prior hospital admission records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
            {admissions.map((adm) => (
              <div
                key={adm.admissionId}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-teal-800">{adm.admissionId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {adm.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Ward: {adm.assignedWardName || adm.assignedWardId} (Bed {adm.assignedBedNumber}) • Doctor:{' '}
                    {adm.admittingDoctorName} • Date: {adm.admissionDateStr}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/operations/admissions/${adm.admissionId}`)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-white rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1 self-start md:self-auto"
                >
                  View Record <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAdmissionsPage;
