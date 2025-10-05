export const createPointGeometry = (longitude: number, latitude: number): string => {
  return `POINT(${longitude} ${latitude})`;
};

export const createOptionalPointGeometry = (longitude?: number, latitude?: number): string | undefined => {
  if (longitude !== undefined && latitude !== undefined) {
    return createPointGeometry(longitude, latitude);
  }
  return undefined;
};