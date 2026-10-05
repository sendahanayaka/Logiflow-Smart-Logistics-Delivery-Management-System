import React from 'react';
import { AssignmentPanel } from '../components/AssignmentPanel';
import { FleetHeader } from '../components/FleetHeader';

export const AssignmentPage: React.FC = () => {
  return (
    <section className="portal-container" aria-labelledby="assignment-page-title">
      <FleetHeader
        title="Driver & Vehicle Assignments"
        subtitle="Manage active driver-vehicle assignments and assignment history."
        breadcrumbs={[{ label: 'Assignments' }]}
        activeTab="assignments"
      />

      <AssignmentPanel />
    </section>
  );
};

export default AssignmentPage;
