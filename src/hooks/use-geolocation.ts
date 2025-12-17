import { useState, useCallback, useEffect } from 'react';

// Check if running on secure origin (HTTPS or localhost)
export const isSecureOrigin = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

// Safe geolocation wrapper that handles HTTP gracefully
export const safeGetCurrentPosition = (
  onSuccess: (position: GeolocationPosition | null) => void,
  onError?: (error: GeolocationPositionError | Error) => void,
  options?: PositionOptions
): void => {
  if (!navigator.geolocation) {
    onError?.(new Error('Geolocalização não é suportada pelo seu navegador'));
    return;
  }

  if (!isSecureOrigin()) {
    console.warn('Geolocation requires HTTPS. Continuing without location.');
    // Call success with null to allow the operation to continue without location
    onSuccess(null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => onSuccess(position),
    (error) => {
      console.error('Geolocation error:', error);
      if (onError) {
        onError(error);
      } else {
        // Default: continue without location
        onSuccess(null);
      }
    },
    options || { enableHighAccuracy: true }
  );
};

export interface GeolocationState {
  loading: boolean;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  isSecureOrigin: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoFetch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    autoFetch = false,
  } = options;

  // Check if running on secure origin (HTTPS or localhost)
  const isSecureOrigin = typeof window !== 'undefined' && (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    isSecureOrigin,
  });

  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setSupported(false);
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo seu navegador',
      }));
    } else if (!isSecureOrigin) {
      // On HTTP, geolocation won't work - set a warning but don't block
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização requer conexão segura (HTTPS). Continuando sem localização.',
      }));
    }
  }, [isSecureOrigin]);

  const getLocation = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada pelo seu navegador'));
        return;
      }

      // If not on secure origin, resolve with null instead of failing
      if (!isSecureOrigin) {
        console.warn('Geolocation requires HTTPS. Skipping geolocation.');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Geolocalização requer HTTPS. Continuando sem localização.',
          latitude: null,
          longitude: null,
        }));
        resolve(null);
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            error: null,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            isSecureOrigin,
          });
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Erro ao obter localização';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Permissão de localização negada. Por favor, habilite nas configurações do navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                'Localização indisponível. Verifique se o GPS está habilitado.';
              break;
            case error.TIMEOUT:
              errorMessage =
                'Tempo esgotado ao obter localização. Tente novamente.';
              break;
          }

          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, isSecureOrigin]);

  useEffect(() => {
    if (autoFetch && supported) {
      getLocation().catch(() => {
        
      });
    }
  }, [autoFetch, supported, getLocation]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      isSecureOrigin,
    });
  }, [isSecureOrigin]);

  return {
    ...state,
    supported,
    isSecureOrigin,
    getLocation,
    clearError,
    reset,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

export default useGeolocation;
