// src/pages/AdminSignups.jsx
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import Loading from '../components/Loading';
import Retry from '../components/Retry';

const METHOD_COLORS = {
  password: { bg: 'var(--color-border)', color: 'var(--color-text-secondary)' },
  google: { bg: '#dbeafe', color: '#1e40af' },
};

const getMethodColors = (method) => METHOD_COLORS[method] || { bg: 'var(--color-border)', color: 'var(--color-text-secondary)' };

export default function AdminSignups() {
  const [signups, setSignups] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadSignups = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSignups(page, 25);
      setSignups(response.data.signups);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignups(currentPage);
  }, [currentPage]);

  // Opening this page is what clears the Admin nav badge.
  useEffect(() => {
    apiService.markSignupsSeen().catch((err) => console.error('Failed to mark signups seen:', err));
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return;
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  if (loading && !signups.length) return <Loading message="Loading signups" />;
  if (error) return <Retry error={error} />;

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-surface-muted)', minHeight: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Signups</h1>
        {pagination && (
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries
          </p>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Username</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Method</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {signups.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No signups yet</td>
                </tr>
              ) : (
                signups.map((entry) => {
                  const colors = getMethodColors(entry.method);
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{entry.username}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{entry.email || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: colors.bg, color: colors.color, fontSize: '0.75rem', fontWeight: '500' }}>
                          {entry.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{formatDate(entry.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === 1 ? 'var(--color-border)' : '#3b82f6', color: currentPage === 1 ? 'var(--color-text-faint)' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{ padding: '0.5rem 0.75rem', backgroundColor: currentPage === pageNum ? '#3b82f6' : 'var(--color-bg-surface)', color: currentPage === pageNum ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: currentPage === pageNum ? '600' : '400' }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            style={{ padding: '0.5rem 1rem', backgroundColor: currentPage === pagination.totalPages ? 'var(--color-border)' : '#3b82f6', color: currentPage === pagination.totalPages ? 'var(--color-text-faint)' : 'white', border: 'none', borderRadius: '4px', cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
