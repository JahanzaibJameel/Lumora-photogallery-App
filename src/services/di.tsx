import React, { ReactNode, useMemo, useContext, useRef, useEffect, createContext } from 'react';

type ServiceToken = string;

/**
 * ServiceRegistry is the global service container singleton.
 *
 * Design: services self-register at module load (via registerService) so that
 * service-to-service calls (e.g. MediaService → PerformanceMonitoringService)
 * resolve without a React context. The ServiceProvider component wraps the tree
 * and can override the container for testing. The ref indirection keeps
 * resolveService stable across renders while remaining the single write point.
 */
const defaultContainer = new Map<ServiceToken, unknown>();

export const ServiceTokens = {
  MediaService: 'MediaService',
  StorageService: 'StorageService',
  WidgetService: 'WidgetService',
  PerformanceService: 'PerformanceService',
} as const;

export type ServiceTokenType = typeof ServiceTokens[keyof typeof ServiceTokens];

const ServiceContext = createContext<Map<ServiceToken, unknown>>(defaultContainer);

export { ServiceContext };

// Global container ref: the single write point for service registration.
// Written by ServiceProvider on mount; read by resolveService everywhere.
const activeContainerRef = { current: defaultContainer };

export function resolveService<T>(token: ServiceToken): T {
  const container = activeContainerRef.current;
  const service = container.get(token);
  if (!service) {
    throw new Error(`Service not registered: ${token}`);
  }
  return service as T;
}

export function registerService<T>(token: ServiceToken, implementation: T): void {
  activeContainerRef.current.set(token, implementation);
}

export function clearServices(): void {
  activeContainerRef.current = defaultContainer;
  defaultContainer.clear();
}

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
    activeContainerRef.current = container;
    return () => {
      activeContainerRef.current = defaultContainer;
    };
  }, [container]);

  return (
    <ServiceContext.Provider value={container}>
      {children}
    </ServiceContext.Provider>
  );
};

export function useService<T>(token: ServiceToken): T {
  const container = useContext(ServiceContext);
  const service = container.get(token);
  if (!service) {
    throw new Error(`Service not registered: ${token}`);
  }
  return service as T;
}
