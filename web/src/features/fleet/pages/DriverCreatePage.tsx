import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DriverForm } from '../components/DriverForm';

export const DriverCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="users-page">
      <a
        href="/drivers"
        className="back-link"
        onClick={(e) => {
          e.preventDefault();
          navigate('/drivers');
        }}
      >
        &larr; Back to Driver List
      </a>
      <DriverForm
        onCancel={() => navigate('/drivers')}
        onSuccess={() => navigate('/drivers')}
      />
    </section>
  );
};

export default DriverCreatePage;
