import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './server';

// Alinear la base de datos de axiosWrapper con los handlers de MSW.
vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:4000');

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());