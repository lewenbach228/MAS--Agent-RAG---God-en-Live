/**
 * Tests du composant App
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/app/App';

describe('App', () => {
  it('renders the God en Live chat interface', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /god en live/i })
    ).toBeTruthy();

    expect(
      screen.getByPlaceholderText(/pose ta question/i)
    ).toBeTruthy();

    expect(
      screen.getByRole('button', { name: /demo/i })
    ).toBeTruthy();
  });
});
