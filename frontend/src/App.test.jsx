import { render, screen } from '@testing-library/react';
import App from './App';

test('renders demo access button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /enter demo app/i });
  expect(buttonElement).toBeInTheDocument();
});
