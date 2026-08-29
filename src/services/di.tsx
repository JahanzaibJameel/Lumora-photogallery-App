import React, { ReactNode, useMemo, useEffect } from 'react';
import { createContext } from 'react';

type ServiceToken = string;

const defaultContainer = new Map<ServiceToken, unknown>();
let activeContainer = defaultContainer;

export const ServiceTokens = {
  MediaService: 'MediaService',
  StorageService: 'StorageService',
  WidgetService: 'WidgetService',
} as const;

export type ServiceTokenType = typeof ServiceTokens[keyof typeof ServiceTokens];

export function registerService<T>(token: ServiceToken, implementation: T): void {
  activeContainer.set(token, implementation);
}

export function resolveService<T>(token: ServiceToken): T {
  const service = activeContainer.get(token);
  if (!service) {
    throw new Error(`Service not registered: ${token}`);
  }
  return service as T;
}

export function clearServices(): void {
  activeContainer.clear();
}

const ServiceContext = createContext<Map<ServiceToken, unknown>>(defaultContainer);

interface ServiceProviderProps {
  children: ReactNode;
  services?: Partial<Record<ServiceToken, unknown>>;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, services }) => {
  const container = useMemo(() => {
    const map = new Map<ServiceToken, unknown>();
    if (services) {
      for (const [token, impl] of Object.entries(services)) {
        map.set(token, impl);
      }
    }
    return map;
  }, [services]);

  useEffect(() => {
    const prev = activeContainer;
    activeContainer = container;
    return () => {
      activeContainer = prev;
    };
  }, [container]);

  return (
    <ServiceContext.Provider value={container}>
      {children}
    </ServiceContext.Provider>
  );
};
