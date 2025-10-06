import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * Simple Azure Functions HTTP trigger that returns mock air quality data
 * Test URL: /air-quality?latitude=49.2827&longitude=-123.1207
 */
export const getAirQuality = async (_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
  context.log('Air Quality API request received');

  // Simple mock response
  const mockResponse = {
    location: {
      neighborhood: 'Downtown',
      city: 'Vancouver',
      country: 'Canada',
      latitude: 49.2827,
      longitude: -123.1207
    },
    current: {
      datetime: new Date().toISOString(),
      AQI: 65,
      AQI_category: 'Moderate',
      AQI_color: '#FFFF00',
      NO2: 22.5,
      O3: 35.1,
      PM25: 18.9
    },
    daily: {
      hours: ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'],
      AQI: [40,45,50,60,55,50,65,70,68,62,58,60,65,70,72,68,65,62,58,55,52,48,45,42],
      NO2: [20,19,22,25,24,22,26,28,27,25,23,24,25,27,28,26,25,24,23,22,21,20,19,18],
      O3: [30,28,31,34,33,31,35,37,36,34,32,33,35,37,38,36,35,34,32,31,30,29,28,27],
      PM25: [15,16,17,18,17.5,17,19,20,19.5,18.5,17.5,18,19,20,21,19.5,19,18.5,17.5,17,16.5,16,15.5,15]
    }
  };

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(mockResponse)
  };
};


// Register the HTTP trigger function
app.http('air-quality', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getAirQuality
});