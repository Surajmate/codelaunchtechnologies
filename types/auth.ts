export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;

  // Personal
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;

  // Address / Contact
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Education
  highestQualification?: string;
  specialization?: string;
  college?: string;
  university?: string;
  graduationYear?: string;

  // Professional
  employmentStatus?: string;
  company?: string;
  designation?: string;
  experience?: string;

  // Account
  role: UserRole;
  avatar?: string;
  isActive?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupRequest {
  // Personal
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;

  // Address / Contact
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Education
  highestQualification: string;
  specialization?: string;
  college?: string;
  university?: string;
  graduationYear?: string;

  // Professional
  employmentStatus?: string;
  company?: string;
  designation?: string;
  experience?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}