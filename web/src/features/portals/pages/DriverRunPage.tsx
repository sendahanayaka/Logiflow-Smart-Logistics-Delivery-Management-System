// [S4]  driver run detail page — reads the shipment id from the route.
import React from 'react';
import { useParams } from 'react-router-dom';
import '../Portal.css';
import '../../delivery/driver.css';
import { DriverRunDetail } from '../../delivery/components/DriverRunDetail';

export const DriverRunPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">DRIVER</span>
                <h1>Run detail</h1>
                <p>Update each stop as you go. Marking a stop arrived recomputes the ETAs for the stops ahead.</p>
            </header>

            {id ? (
                <DriverRunDetail shipmentId={id} />
            ) : (
                <div className="driver-state driver-state--error">No run selected.</div>
            )}
        </div>
    );
};

export default DriverRunPage;
