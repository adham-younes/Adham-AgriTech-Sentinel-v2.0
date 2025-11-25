// This file configures Mapbox with the access token
import mapboxgl from 'mapbox-gl';

// Initialize Mapbox with the public access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Add a custom style for NDVI visualization
export const mapStyles = {
  satellite: 'satellite-v9',
  streets: 'streets-v11',
  ndvi: 'mapbox://styles/mapbox/satellite-v9' // This would be a custom style for NDVI
};

export default mapboxgl;
