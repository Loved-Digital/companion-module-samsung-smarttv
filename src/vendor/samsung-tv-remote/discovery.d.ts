import type { SamsungDevice } from './models';
/**
 * Searches for last connected device, if any.
 *
 * @returns {SamsungDevice | undefined} The device if found, or undefined otherwise
 */
export declare const getLastConnectedDevice: () => SamsungDevice | undefined;
/**
 * Retrieves a list of Samsung devices that are currently awake and reachable on the network.
 *
 * @async
 * @param {number} [timeout=500] The maximum time in milliseconds to wait for the response
 * @returns {Promise<SamsungDevice[]>} A promise that resolves with an array of awake Samsung devices
 */
export declare const getAwakeSamsungDevices: (timeout?: number) => Promise<SamsungDevice[]>;
