import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { ServiceTokens, resolveService, registerService, clearServices, ServiceProvider, useService } from './di';

describe('di', () => {
  beforeEach(() => {
    clearServices();
  });

  it('resolves a registered service', () => {
    const mockService = { foo: 'bar' };
    registerService(ServiceTokens.MediaService, mockService);
    expect(resolveService(ServiceTokens.MediaService)).toBe(mockService);
  });

  it('throws for unregistered service', () => {
    expect(() => resolveService('NonExistent')).toThrow('Service not registered: NonExistent');
  });

  it('clearServices clears all registrations', () => {
    registerService(ServiceTokens.MediaService, { foo: 'bar' });
    clearServices();
    expect(() => resolveService(ServiceTokens.MediaService)).toThrow();
  });

  it('ServiceProvider provides services via context', () => {
    const testService = { test: true };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ServiceProvider services={{ [ServiceTokens.MediaService]: testService }}>
        {children}
      </ServiceProvider>
    );
    const { result } = renderHook(() => useService(ServiceTokens.MediaService), { wrapper });
    expect(result.current).toBe(testService);
  });
});
