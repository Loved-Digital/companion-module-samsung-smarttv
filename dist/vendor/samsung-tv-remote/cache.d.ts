import type { SamsungApp, SamsungDevice } from './models';
export declare const getDeviceFromCache: () => SamsungDevice | undefined;
export declare const saveDeviceToCache: (ip: string, mac: string, friendlyName: string) => void;
export declare const getAppFromCache: (appName: string) => SamsungApp | undefined;
export declare const saveAppToCache: (ip: string, port: number, appName: string, appToken: string) => void;
