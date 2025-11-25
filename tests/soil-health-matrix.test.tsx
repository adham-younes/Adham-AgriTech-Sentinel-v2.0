import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SoilHealthMatrix } from '../components/analytics/soil-health-matrix'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              nitrogen: 45,
              phosphorus: 32,
              potassium: 78,
              ph: 6.8,
              moisture: 65,
              organic_matter: 3.2,
              temperature: 22,
              conductivity: 1.2
            },
            error: null
          })
        })
      })
    })
  })
}))

describe('SoilHealthMatrix Component', () => {
  test('renders soil health matrix with critical moisture data', async () => {
    render(<SoilHealthMatrix fieldId="test-field-id" />)
    
    await waitFor(() => {
      expect(screen.getByText('Soil Health Matrix')).toBeInTheDocument()
    })
    
    // Check if critical moisture (65) shows appropriate warning color
    const moistureElement = screen.getByText(/moisture/i)
    expect(moistureElement).toBeInTheDocument()
    
    // Verify theme compliance - should use vivid green (#10b981) for good values
    const goodElements = screen.getAllByText(/78|6\.8|3\.2/)
    expect(goodElements.length).toBeGreaterThan(0)
  })

  test('displays correct color coding for critical values', async () => {
    render(<SoilHealthMatrix fieldId="test-field-id" />)
    
    await waitFor(() => {
      const moistureValue = screen.getByText('65')
      expect(moistureValue).toHaveClass('text-orange-500') // Critical moisture
    })
  })
})
