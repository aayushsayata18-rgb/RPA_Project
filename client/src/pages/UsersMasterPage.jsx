import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Users, RefreshCw } from 'lucide-react';

export const UsersMasterPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { header: 'User ID', accessor: 'userId', render: (row) => <code style={{ color: '#38bdf8' }}>{row.userId}</code> },
    { header: 'Full Name', accessor: 'name', render: (row) => `${row.firstName} ${row.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role', render: (row) => <span className="badge badge-info">{row.role}</span> },
    { header: 'Status', accessor: 'isActive', render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { header: 'Linked Entity', accessor: 'linkedEntityId', render: (row) => row.linkedEntityId || '—' },
    { header: 'Last Login', accessor: 'lastLoginAt', render: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : 'Never' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Master & RBAC Directory</h1>
          <p className="page-subtitle">Hospital Staff, Practitioners & Patients (00_MASTER.md Section 11)</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchUsers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={users} emptyMessage="No users found." />
      </div>
    </div>
  );
};
