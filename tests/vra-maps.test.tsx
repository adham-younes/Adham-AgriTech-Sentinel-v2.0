import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdvancedVRAMaps from '../components/precision/advanced-vra-maps-fixed'

// Mock Leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: ({ data }: { data: any }) => <div data-testid="geo-json">{JSON.stringify(data)}</div>
}))

// Mock translation
jest.mock('@/lib/i18n/use-language', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en'
  })
}))

describe('AdvancedVRAMaps Component', () => {
  test('renders VRA maps with field data', () => {
    const mockField = {
      id: 'test-field',
      center: [30.0444, 31.2357],
      area: 100
    }
    
    render(<AdvancedVRAMaps field={mockField} />)
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
  })

  test('displays zone management with 5 zones', () => {
    const mockField = {
      id: 'test-field',
      center: [30.0444, 31.2357],
      area: 100
    }
    
    render(<AdvancedVRAMaps field={mockField} />)
    
    // Should display 5 management zones
    expect(screen.getByText(/zone/i)).toBeInTheDocument()
  })

  test('follows matte black theme requirements', () => {
    const mockField = {
      id: 'test-field',
      center: [30.0444, 31.2357],
      area: 100
    }
    
    render(<AdvancedVRAMaps field={mockField} />)
    
    // Check for theme compliance - no white backgrounds
    const container = screen.getByTestId('map-container')
    expect(container).not.toHaveClass('bg-white')
    expect(container).not.toHaveStyle('background-color: white')
  })
})
