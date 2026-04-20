import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickStarts from '../components/QuickStarts';

describe('QuickStarts Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders all 4 template buttons', () => {
    render(<QuickStarts onSelect={mockOnSelect} />);
    
    expect(screen.getByRole('button', { name: /5-day honeymoon package, luxury/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3-day budget backpacker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7-day family trip with kids/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adventure week/i })).toBeInTheDocument();
  });

  it('calls onSelect with the correct template text when a button is clicked', () => {
    render(<QuickStarts onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByRole('button', { name: /5-day honeymoon package, luxury/i }));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('5-day honeymoon package, luxury');
  });

  it('calls onSelect with the correct text for each template button', () => {
    render(<QuickStarts onSelect={mockOnSelect} />);
    
    const expectedTemplates = [
      '5-day honeymoon package, luxury',
      '3-day budget backpacker',
      '7-day family trip with kids',
      'Adventure week (scuba + trekking)',
    ];

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(expectedTemplates.length);

    buttons.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(mockOnSelect).toHaveBeenNthCalledWith(i + 1, expectedTemplates[i]);
    });
  });

  it('each button has a descriptive aria-label', () => {
    render(<QuickStarts onSelect={mockOnSelect} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
      expect(btn.getAttribute('aria-label').length).toBeGreaterThan(5);
    });
  });
});
