export interface CreateDeliveryOrderRequest {
    pickupAddress: string;
    pickupCity: string;
    deliveryAddress: string;
    deliveryCity: string;
    packageDescription: string;
    specialHandling?: string;
    preferredPickupDate: string;
    preferredPickupTime: string;
    priority: string;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    recipientName?: string;
    recipientContact?: string;
}

export interface DeliveryOrderResponse {
    id: string;
    customerId: string;
    pickupAddress: string;
    pickupCity: string;
    deliveryAddress: string;
    deliveryCity: string;
    packageDescription: string;
    specialHandling?: string;
    preferredPickupDate: string;
    preferredPickupTime: string;
    priority: string;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    recipientName?: string;
    recipientContact?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
}
