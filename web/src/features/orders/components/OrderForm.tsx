import React, { useState } from 'react';
import { CreateDeliveryOrderRequest } from '../types';
import '../Orders.css';

interface Props {
    onSubmit: (request: CreateDeliveryOrderRequest) => void;
    isLoading: boolean;
}

export const OrderForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState<CreateDeliveryOrderRequest>({
        pickupAddress: '',
        pickupCity: '',
        deliveryAddress: '',
        deliveryCity: '',
        packageDescription: '',
        specialHandling: '',
        preferredPickupDate: new Date().toISOString().split('T')[0],
        preferredPickupTime: '09:00:00',
        priority: 'Standard',
        weightKg: 1,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
        recipientName: '',
        recipientContact: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.weightKg <= 0 || formData.lengthCm <= 0 || formData.widthCm <= 0 || formData.heightCm <= 0) {
            setError('Weight and all dimensions must be strictly positive attributes.');
            return;
        }

        if (formData.recipientContact && formData.recipientContact.length < 3) {
            setError('Recipient contact format is completely invalid.');
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="orders-panel">
            {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}

            <h3 className="orders-title" style={{ marginBottom: '1rem' }}>Pickup Details</h3>
            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Pickup Address *</label>
                    <input type="text" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Pickup City *</label>
                    <input type="text" name="pickupCity" value={formData.pickupCity} onChange={handleChange} required className="orders-form-control" />
                </div>
            </div>

            <h3 className="orders-title" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Delivery Details</h3>
            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Delivery Address *</label>
                    <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Delivery City *</label>
                    <input type="text" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} required className="orders-form-control" />
                </div>
            </div>

            <h3 className="orders-title" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Package Information</h3>
            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Description *</label>
                    <input type="text" name="packageDescription" value={formData.packageDescription} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Special Handling</label>
                    <input type="text" name="specialHandling" value={formData.specialHandling} onChange={handleChange} className="orders-form-control" placeholder="Optional" />
                </div>
            </div>

            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Weight (kg) *</label>
                    <input type="number" step="0.1" name="weightKg" value={formData.weightKg} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Length (cm) *</label>
                    <input type="number" step="0.1" name="lengthCm" value={formData.lengthCm} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Width (cm) *</label>
                    <input type="number" step="0.1" name="widthCm" value={formData.widthCm} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Height (cm) *</label>
                    <input type="number" step="0.1" name="heightCm" value={formData.heightCm} onChange={handleChange} required className="orders-form-control" />
                </div>
            </div>

            <h3 className="orders-title" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Schedule & Priority</h3>
            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Preferred Pickup Date *</label>
                    <input type="date" name="preferredPickupDate" value={formData.preferredPickupDate} onChange={handleChange} required className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Preferred Pickup Time (HH:mm) *</label>
                    <input type="time" name="preferredPickupTime" value={formData.preferredPickupTime} onChange={handleChange} required className="orders-form-control" step="1" />
                </div>
                <div className="orders-form-group">
                    <label>Priority *</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} required className="orders-form-control">
                        <option value="Standard">Standard</option>
                        <option value="Express">Express</option>
                    </select>
                </div>
            </div>

            <h3 className="orders-title" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Recipient Details (Optional)</h3>
            <div className="orders-grid">
                <div className="orders-form-group">
                    <label>Recipient Name</label>
                    <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="orders-form-control" />
                </div>
                <div className="orders-form-group">
                    <label>Recipient Contact</label>
                    <input type="text" name="recipientContact" value={formData.recipientContact} onChange={handleChange} className="orders-form-control" />
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isLoading} className="orders-btn-primary">
                    {isLoading ? 'Creating...' : 'Create Delivery Order'}
                </button>
            </div>
        </form>
    );
};
