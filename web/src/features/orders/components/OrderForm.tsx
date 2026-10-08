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
            setError('Weight and all dimensions must be strictly positive.');
            return;
        }

        if (formData.recipientContact && formData.recipientContact.length < 3) {
            setError('Recipient contact format is invalid.');
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



    return (
        <form onSubmit={handleSubmit} className="booking-form-container">
            {error && <div className="orders-alert orders-alert-danger">{error}</div>}

            <div className="orders-panel">
                <div className="section-header">
                    <span className="section-number">1</span>
                    <h3 className="section-title">DELIVERY DETAILS</h3>
                </div>
                <div className="orders-grid">
                    <div className="orders-form-group">
                        <label htmlFor="pickupAddress">Pickup Address *</label>
                        <input id="pickupAddress" type="text" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} required className="orders-form-control" placeholder="123 Business Rd" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="pickupCity">Pickup City *</label>
                        <input id="pickupCity" type="text" name="pickupCity" value={formData.pickupCity} onChange={handleChange} required className="orders-form-control" placeholder="Colombo" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="deliveryAddress">Delivery Address *</label>
                        <input id="deliveryAddress" type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required className="orders-form-control" placeholder="456 Destination Ave" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="deliveryCity">Delivery City *</label>
                        <input id="deliveryCity" type="text" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} required className="orders-form-control" placeholder="Kandy" disabled={isLoading} />
                    </div>
                </div>
            </div>

            <div className="orders-panel">
                <div className="section-header">
                    <span className="section-number">2</span>
                    <h3 className="section-title">PACKAGE DETAILS</h3>
                </div>
                <div className="orders-grid">
                    <div className="orders-form-group">
                        <label htmlFor="packageDescription">Package Description *</label>
                        <input id="packageDescription" type="text" name="packageDescription" value={formData.packageDescription} onChange={handleChange} required className="orders-form-control" placeholder="e.g. Office Supplies" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="specialHandling">Special Handling</label>
                        <input id="specialHandling" type="text" name="specialHandling" value={formData.specialHandling} onChange={handleChange} className="orders-form-control" placeholder="e.g. Fragile, Keep Upright" disabled={isLoading} />
                    </div>
                </div>
                <div className="orders-grid" style={{ marginTop: '1rem' }}>
                    <div className="orders-form-group">
                        <label htmlFor="weightKg">Weight (kg) *</label>
                        <input id="weightKg" type="number" step="0.1" name="weightKg" value={formData.weightKg} onChange={handleChange} required min="0.1" className="orders-form-control" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="lengthCm">Length (cm) *</label>
                        <input id="lengthCm" type="number" step="0.1" name="lengthCm" value={formData.lengthCm} onChange={handleChange} required min="1" className="orders-form-control" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="widthCm">Width (cm) *</label>
                        <input id="widthCm" type="number" step="0.1" name="widthCm" value={formData.widthCm} onChange={handleChange} required min="1" className="orders-form-control" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="heightCm">Height (cm) *</label>
                        <input id="heightCm" type="number" step="0.1" name="heightCm" value={formData.heightCm} onChange={handleChange} required min="1" className="orders-form-control" disabled={isLoading} />
                    </div>
                </div>
            </div>

            <div className="orders-panel">
                <div className="section-header">
                    <span className="section-number">3</span>
                    <h3 className="section-title">DELIVERY OPTIONS</h3>
                </div>
                <div className="orders-grid">
                    <div className="orders-form-group">
                        <label htmlFor="preferredPickupDate">Preferred Pickup Date *</label>
                        <input id="preferredPickupDate" type="date" name="preferredPickupDate" value={formData.preferredPickupDate} onChange={handleChange} required className="orders-form-control" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="preferredPickupTime">Preferred Pickup Time (HH:mm) *</label>
                        <input id="preferredPickupTime" type="time" name="preferredPickupTime" value={formData.preferredPickupTime} onChange={handleChange} required className="orders-form-control" step="1" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="priority">Priority *</label>
                        <select id="priority" name="priority" value={formData.priority} onChange={handleChange} required className="orders-form-control" disabled={isLoading}>
                            <option value="Standard">Standard</option>
                            <option value="Express">Express</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="orders-panel">
                <div className="section-header">
                    <span className="section-number">4</span>
                    <h3 className="section-title">RECIPIENT DETAILS</h3>
                </div>
                <div className="orders-grid">
                    <div className="orders-form-group">
                        <label htmlFor="recipientName">Recipient Name</label>
                        <input id="recipientName" type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className="orders-form-control" placeholder="Optional" disabled={isLoading} />
                    </div>
                    <div className="orders-form-group">
                        <label htmlFor="recipientContact">Recipient Contact</label>
                        <input id="recipientContact" type="text" name="recipientContact" value={formData.recipientContact} onChange={handleChange} className="orders-form-control" placeholder="Optional" disabled={isLoading} />
                    </div>
                </div>
            </div>

            <div className="orders-panel review-panel">
                <div className="section-header">
                    <span className="section-number">5</span>
                    <h3 className="section-title">PROCEED TO CHECKOUT</h3>
                </div>
                <p className="review-text">
                    By proceeding, you will create a pending Delivery Order. You will then be able to review the finalized agent-calculated delivery fee and select your payment method before confirming the booking.
                </p>
                <div className="submit-action-container">
                    <button type="submit" disabled={isLoading || !hasRequiredFields} className="orders-btn-primary btn-large">
                        {isLoading ? 'Processing...' : 'Calculate Fee & Proceed to Checkout'}
                    </button>
                </div>
            </div>
        </form>
    );
};
