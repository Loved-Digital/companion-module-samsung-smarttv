import type { Keys } from './keys';
import type { SamsungTvRemoteOptions } from './models';
export declare class SamsungTvRemote {
    #private;
    constructor(options: Omit<SamsungTvRemoteOptions, 'device'>);
    constructor(options: Omit<SamsungTvRemoteOptions, 'ip' | 'mac'>);
    /**
     * Sends a key to the TV.
     *
     * @async
     * @param {keyof typeof Keys} key The key to be sent
     * @returns {Promise<void>} A void promise
     */
    sendKey(key: keyof typeof Keys): Promise<void>;
    /**
     * Sends multiple keys to the TV.
     *
     * @async
     * @param {(keyof typeof Keys)[]} keys An array of keys to be sent
     * @returns {Promise<void>} A void promise
     */
    sendKeys(keys: (keyof typeof Keys)[]): Promise<void>;
    /**
     * Turns the TV on or awaken it from sleep mode (also called WoL - Wake-on-LAN).
     *
     * The mac address option is required in this case.
     *
     * @async
     * @returns {Promise<void>} A void promise
     */
    wakeTV(): Promise<void>;
    /**
     * Closes the connection to the TV.
     *
     * It doesn't shut down the TV - it only closes the connection to it.
     */
    disconnect(): void;
}
