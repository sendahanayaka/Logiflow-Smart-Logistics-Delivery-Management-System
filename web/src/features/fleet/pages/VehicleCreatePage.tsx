import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleForm } from '../components/VehicleForm';
import { FleetHeader } from '../components/FleetHeader';

export const VehicleCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="portal-container">
      <FleetHeader
        title="Register Vehicle"
        subtitle="Add a new vehicle asset into the fleet inventory."
        breadcrumbs={[
          { label: 'Vehicles', path: '/fleet/vehicles' },
          { label: 'Register Vehicle' },
        ]}
        activeTab="vehicles"
      />
      <VehicleForm
        onCancel={() => navigate('/fleet/vehicles')}
        onSuccess={() => navigate('/fleet/vehicles')}
      />
    </section>
  );
};

export default VehicleCreatePage;
