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

        const payload = { ...formData };

        if (payload.preferredPickupDate && payload.preferredPickupDate.length === 10) {
            payload.preferredPickupDate = `${payload.preferredPickupDate}T00:00:00Z`;
        }

        if (payload.preferredPickupTime && payload.preferredPickupTime.length === 5) {
            payload.preferredPickupTime = `${payload.preferredPickupTime}:00`;
        }

        onSubmit(payload);
    };

    const hasRequiredFields = formData.pickupCity && formData.deliveryCity && formData.weightKg > 0 && formData.lengthCm > 0 && formData.widthCm > 0 && formData.heightCm > 0;

    const sameCity = formData.pickupCity.trim().toLowerCase() === formData.deliveryCity.trim().toLowerCase();

    let estimatedFee = 500;
    let estimatedTime = '';
    let estimatedDistance = 0;

    if (hasRequiredFields) {
        const weight = formData.weightKg;
        if (weight > 10) {
            estimatedFee += 500 + Math.ceil(weight - 10) * 100; // 100 LKR per extra kg
        } else if (weight >= 5) {
            estimatedFee += 250;
        } else if (weight >= 1) {
            estimatedFee += 100;
        }

        const volume = formData.lengthCm * formData.widthCm * formData.heightCm;
        if (volume > 50000) estimatedFee += 500;
        else if (volume > 10000) estimatedFee += 200;

        if (!sameCity) {
            const pickup = formData.pickupCity.trim().toLowerCase();
            const delivery = formData.deliveryCity.trim().toLowerCase();

            const distances: Record<string, number> = {
                'colombo': 0, 'malabe': 15, 'battaramulla': 10, 'maharagama': 15, 'nugegoda': 10,
                'dehiwala': 10, 'moratuwa': 20, 'panadura': 25, 'negombo': 40, 'gampaha': 30,
                'kandy': 115, 'galle': 120, 'matara': 160, 'kurunegala': 95, 'anuradhapura': 205,
                'jaffna': 395, 'trincomalee': 265, 'nuwara eliya': 160, 'ratnapura': 100,
                'hambantota': 240, 'kegalle': 80, 'matale': 140, 'badulla': 230
            };

            const d1 = distances[pickup];
            const d2 = distances[delivery];

            if (d1 !== undefined && d2 !== undefined) {
                if (d1 === 0) estimatedDistance = d2;
                else if (d2 === 0) estimatedDistance = d1;
                else if (d1 <= 25 && d2 <= 25) estimatedDistance = Math.max(10, Math.abs(d1 - d2)); // suburbs 
                else estimatedDistance = d1 + d2; // proxy for routing via colombo
            } else {
                // Fallback deterministic distance based on string lengths if unknown 
                estimatedDistance = Math.max(25, Math.abs(pickup.length - delivery.length) * 10 + 40);
            }

            estimatedFee += Math.ceil(estimatedDistance * 50); // 50 LKR per km
        }

        const isExpress = formData.priority === 'Express';
        if (isExpress) {
            estimatedFee = Math.ceil(estimatedFee * 1.5); // 50% premium for express
        }

        if (sameCity) {
            estimatedTime = isExpress ? 'Same day' : '1–2 days';
        } else {
            estimatedTime = isExpress ? '1–2 days' : '2–3 days';
        }
    }

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

            <div className="orders-estimate-card">
                <div className="estimate-header">
                    <h4 className="estimate-title">🚚 Delivery Estimate</h4>
                    <p className="estimate-subtitle">Estimated based on your package details</p>
                </div>
                {!hasRequiredFields ? (
                    <p className="estimate-placeholder">Enter package and delivery details to see your estimate.</p>
                ) : (
                    <>
                        <div className="estimate-grid">
                            <div className="estimate-block">
                                <span className="estimate-label">Estimated Delivery</span>
                                <span className="estimate-value time-value">{estimatedTime}</span>
                            </div>
                            <div className="estimate-block">
                                <span className="estimate-label">Est. Distance</span>
                                <span className="estimate-value">{sameCity ? '< 10' : estimatedDistance} km</span>
                            </div>
                            <div className="estimate-block">
                                <span className="estimate-label">Estimated Fee</span>
                                <span className="estimate-value fee-value">LKR {estimatedFee.toLocaleString()}</span>
                            </div>
                            <div className="estimate-block">
                                <span className="estimate-label">Priority</span>
                                <span className="estimate-value">{formData.priority}</span>
                            </div>
                            <div className="estimate-block">
                                <span className="estimate-label">Package Weight</span>
                                <span className="estimate-value">{formData.weightKg.toLocaleString()} kg</span>
                            </div>
                        </div>
                        <p className="estimate-note">Estimate only. Final delivery cost and time may vary.</p>
                    </>
                )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isLoading} className="orders-btn-primary">
                    {isLoading ? 'Creating...' : 'Create Delivery Order'}
                </button>
            </div>
        </form>
    );
};
