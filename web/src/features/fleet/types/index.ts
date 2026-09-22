export enum DriverStatus {
  OffDuty = 0,
  Available = 1,
  OnDuty = 2,
  OnDelivery = 3,
  Suspended = 4,
  Inactive = 5,
}

export enum VehicleStatus {
  Available = 0,
  InTransit = 1,
  InMaintenance = 2,
  OutOfService = 3,
  Decommissioned = 4,
}

export interface Driver {
  id: string;
  userId: string | null;
  licenseNumber: string;
  licenseExpiryDate: string;
  phoneNumber: string | null;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDriverRequest {
  userId?: string | null;
  licenseNumber: string;
  licenseExpiryDate: string;
  phoneNumber?: string | null;
  status: DriverStatus;
}

export interface UpdateDriverRequest {
  userId?: string | null;
  licenseNumber: string;
  licenseExpiryDate: string;
  phoneNumber?: string | null;
  status: DriverStatus;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  capacity: number;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateVehicleRequest {
  registrationNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  capacity: number;
  status: VehicleStatus;
}

export interface UpdateVehicleRequest {
  registrationNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  capacity: number;
  status: VehicleStatus;
}

export interface CreateAssignmentRequest {
  driverId: string;
  vehicleId: string;
  notes?: string | null;
}

export interface EndAssignmentRequest {
  notes?: string | null;
}

export interface AssignmentResponse {
  id: string;
  driverId: string;
  vehicleId: string;
  driverLicenseNumber: string;
  vehicleRegistrationNumber: string;
  assignedAt: string;
  unassignedAt?: string | null;
  isActive: boolean;
  notes?: string | null;
}
