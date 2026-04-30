// Quick test file to verify geofence service
import { geofenceService } from './geofenceService';

console.log('Testing geofenceService...');
console.log('Service instance:', geofenceService);
console.log('Has loadDangerZones:', typeof geofenceService.loadDangerZones);
console.log('Has startMonitoring:', typeof geofenceService.startMonitoring);
console.log('Has checkLocation:', typeof geofenceService.checkLocation);

// Test basic functionality
const testZone = {
    latitude: 28.6139,
    longitude: 77.2090,
    radius: 100,
    name: 'Test Zone',
    description: 'Test'
};

console.log('Testing checkLocation...');
const zones = geofenceService.checkLocation(28.6139, 77.2090);
console.log('Zones found:', zones);

export default true;
