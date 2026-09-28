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
  intelligence?: OrderIntelligenceResponse;
}

export interface OrderIntelligenceResponse {
  volumeM3: number;
  weightClassification: string;
  handlingRequirement: string;
  recommendedPriority: string;
  risksOrAmbiguities: string[];
}

export interface PackageItem {
  package_id: string;
  weight_kg: number;
  volume_m3: number;
  fragile?: boolean;
  special_handling?: string[];
}

export interface DispatchOrder {
  id: string;
  destination: string;
  weightKg: number;
  volumeM3: number;
  packagesCount: number;
  priority: 'NORMAL' | 'HIGH' | 'EXPRESS';
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  status: 'READY' | 'ALLOCATED' | 'IN_TRANSIT' | 'CANCELLED';
  customerName?: string;
  contactPhone?: string;
}

export const INITIAL_DISPATCH_ORDERS: DispatchOrder[] = [
  {
    id: 'ORD-101',
    destination: 'Dehiwala',
    weightKg: 200,
    volumeM3: 0.45,
    packagesCount: 2,
    priority: 'HIGH',
    deliveryWindowStart: '08:00 AM',
    deliveryWindowEnd: '12:00 PM',
    status: 'READY',
    customerName: 'Keells Super Dehiwala',
    contactPhone: '0112738491',
  },
  {
    id: 'ORD-102',
    destination: 'Mount Lavinia',
    weightKg: 150,
    volumeM3: 0.35,
    packagesCount: 1,
    priority: 'NORMAL',
    deliveryWindowStart: '09:00 AM',
    deliveryWindowEnd: '01:00 PM',
    status: 'READY',
    customerName: 'Cargills Food City Mt Lavinia',
    contactPhone: '0112712345',
  },
  {
    id: 'ORD-103',
    destination: 'Moratuwa',
    weightKg: 300,
    volumeM3: 0.65,
    packagesCount: 3,
    priority: 'EXPRESS',
    deliveryWindowStart: '08:30 AM',
    deliveryWindowEnd: '11:30 AM',
    status: 'READY',
    customerName: 'Singer Mega Moratuwa',
    contactPhone: '0112645678',
  },
  {
    id: 'ORD-104',
    destination: 'Kandy',
    weightKg: 500,
    volumeM3: 1.10,
    packagesCount: 5,
    priority: 'NORMAL',
    deliveryWindowStart: '10:00 AM',
    deliveryWindowEnd: '04:00 PM',
    status: 'READY',
    customerName: 'Kandy City Centre Outlet',
    contactPhone: '0812234567',
  },
  {
    id: 'ORD-105',
    destination: 'Nugegoda',
    weightKg: 180,
    volumeM3: 0.40,
    packagesCount: 2,
    priority: 'NORMAL',
    deliveryWindowStart: '09:30 AM',
    deliveryWindowEnd: '02:00 PM',
    status: 'READY',
    customerName: 'Laugfs Super Nugegoda',
    contactPhone: '0112823456',
  },
  {
    id: 'ORD-106',
    destination: 'Galle',
    weightKg: 420,
    volumeM3: 0.95,
    packagesCount: 4,
    priority: 'HIGH',
    deliveryWindowStart: '07:00 AM',
    deliveryWindowEnd: '03:00 PM',
    status: 'READY',
    customerName: 'Galle Fort Emporium',
    contactPhone: '0912233445',
  },
];
