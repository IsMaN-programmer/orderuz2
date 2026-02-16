/// <reference types="vite/client" />

// Global constants defined at build time
declare const __ROUTE_MESSAGING_ENABLED__: boolean;
// Yandex Maps API
interface Window {
  ymaps?: {
    ready: (callback: () => void) => void;
    Map: any;
    Placemark: any;
    geocode: (coords: any) => Promise<any>;
  };
}