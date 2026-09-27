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
  fullName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  phoneNumber: string | null;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDriverRequest {
  userId?: string | null;
  fullName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  phoneNumber?: string | null;
  status: DriverStatus;
}

export interface UpdateDriverRequest {
  userId?: string | null;
  fullName: string;
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
  driverName?: string;
  driverLicenseNumber: string;
  vehicleRegistrationNumber: string;
  assignedAt: string;
  unassignedAt?: string | null;
  isActive: boolean;
  notes?: string | null;
}

export enum DutyScheduleStatus {
  Scheduled = 0,
  Active = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface DutyScheduleResponse {
  id: string;
  driverId: string;
  driverName: string;
  startTime: string;
  endTime: string;
  status: DutyScheduleStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateDutyScheduleRequest {
  driverId: string;
  startTime: string;
  endTime: string;
  status?: DutyScheduleStatus;
  notes?: string | null;
}

export interface UpdateDutyScheduleRequest {
  startTime: string;
  endTime: string;
  status: DutyScheduleStatus;
  notes?: string | null;
}

export interface DriverAvailabilityResponse {
  driverId: string;
  driverName: string;
  available: boolean;
  reason: string;
  requestedStartTime: string;
  requestedEndTime: string;
  conflictingScheduleId?: string | null;
}

export enum MaintenanceStatus {
  Scheduled = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface MaintenanceRecordResponse {
  id: string;
  vehicleId: string;
  vehicleRegistrationNumber: string;
  maintenanceDate: string;
  maintenanceType: string;
  description?: string | null;
  cost: number;
  nextMaintenanceDate?: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMaintenanceRecordRequest {
  vehicleId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description?: string | null;
  cost: number;
  nextMaintenanceDate?: string | null;
  status?: MaintenanceStatus;
}

export interface UpdateMaintenanceRecordRequest {
  maintenanceDate: string;
  maintenanceType: string;
  description?: string | null;
  cost: number;
  nextMaintenanceDate?: string | null;
  status: MaintenanceStatus;
}

export interface VehicleMaintenanceStatusResponse {
  vehicleId: string;
  currentlyInMaintenance: boolean;
  maintenanceDue: boolean;
  nextMaintenanceDate?: string | null;
  latestMaintenanceDate?: string | null;
}


