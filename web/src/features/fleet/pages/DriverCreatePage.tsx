import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DriverForm } from '../components/DriverForm';
import { FleetHeader } from '../components/FleetHeader';

export const DriverCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="users-page">
      <FleetHeader
        title="Add New Driver"
        subtitle="Register a new driver into the fleet management database."
        breadcrumbs={[
          { label: 'Drivers', path: '/fleet/drivers' },
          { label: 'Add Driver' },
        ]}
        activeTab="drivers"
      />
      <DriverForm
        onCancel={() => navigate('/fleet/drivers')}
        onSuccess={() => navigate('/fleet/drivers')}
      />
    </section>
  );
};

export default DriverCreatePage;
