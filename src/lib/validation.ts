
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

export const validateRegisterUserRequest = (body: any): { isValid: boolean; error?: string } => {
  if (!body.email || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return { isValid: false, error: "Email, latitude, and longitude are required" };
  }

  if (!validateEmail(body.email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  if (!validateCoordinates(body.latitude, body.longitude)) {
    return { isValid: false, error: "Invalid latitude or longitude values" };
  }

  if (body.latitude2 !== undefined && body.longitude2 !== undefined) {
    if (!validateCoordinates(body.latitude2, body.longitude2)) {
      return { isValid: false, error: "Invalid latitude2 or longitude2 values" };
    }
  }

  return { isValid: true };
};