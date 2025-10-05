export interface RegisterUserRequest {
  email: string;
  latitude: number;
  longitude: number;
  latitude2?: number;
  longitude2?: number;
}

export interface UserResponse {
  id: string;
  email: string;
  latitude: number;
  longitude: number;
  latitude2?: number | null;
  longitude2?: number | null;
  createdAt: Date;
  updatedAt: Date;
}