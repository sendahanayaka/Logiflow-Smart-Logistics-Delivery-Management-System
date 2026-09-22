import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleForm } from '../components/VehicleForm';

export const VehicleCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="users-page">
      <a
        href="/vehicles"
        className="back-link"
        onClick={(e) => {
          e.preventDefault();
          navigate('/vehicles');
        }}
      >
        &larr; Back to Vehicle List
      </a>
      <VehicleForm
        onCancel={() => navigate('/vehicles')}
        onSuccess={() => navigate('/vehicles')}
      />
    </section>
  );
};

export default VehicleCreatePage;
