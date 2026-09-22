import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentPanel } from '../components/AssignmentPanel';

export const AssignmentPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="users-page" aria-labelledby="assignment-page-title">
      <header className="users-page__header">
        <div className="page-heading">
          <span className="eyebrow">Fleet Management</span>
          <h1 id="assignment-page-title">Driver & Vehicle Assignments</h1>
          <p>Assign available drivers to available vehicles, track active assignments, and review audit history.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/drivers')}
          >
            Drivers
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/vehicles')}
          >
            Vehicles
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/assignments')}
          >
            Assignments
          </button>
        </div>
      </header>

      <AssignmentPanel />
    </section>
  );
};

export default AssignmentPage;
