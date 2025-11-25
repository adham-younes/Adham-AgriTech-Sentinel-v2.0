
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdvancedIndexMap } from '@/components/ui/advanced-index-map';

describe('Soil Moisture UI Alerts', () => {
    it('should display Red alert for critical low moisture', () => {
        render(
            <AdvancedIndexMap
                index="moisture"
                value={10} // Very low moisture
                lang="en"
            />
        );

        // Check for "Very Dry" text
        expect(screen.getByText('Very Dry')).toBeInTheDocument();

        // Check for Red color class (approximate check based on implementation)
        // The component uses getStatusColor which returns 'text-red-600' for < 0.2 normalized
        // 10 is < 15 (threshold for very dry)
        const valueDisplay = screen.getByText('10.00%');
        expect(valueDisplay).toHaveClass('text-red-600');
    });

    it('should display Green for good moisture', () => {
        render(
            <AdvancedIndexMap
                index="moisture"
                value={65} // Good moisture
                lang="en"
            />
        );

        expect(screen.getByText('Moist')).toBeInTheDocument();
        const valueDisplay = screen.getByText('65.00%');
        expect(valueDisplay).toHaveClass('text-green-600');
    });
});
