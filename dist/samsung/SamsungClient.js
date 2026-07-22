import { Keys, SamsungTvRemote } from '../vendor/samsung-tv-remote/index.js';
const DEVICE_REST_PORT = 8001;
const DEVICE_API_PATH = '/api/v2/';
const POWER_STATE_FETCH_TIMEOUT_MS = 5000;
const SEND_KEY_TIMEOUT_MS = 2000;
const WAKE_RECONNECT_DELAY_MS = 5000;
/**
 * High-level lifecycle wrapper around the vendored Samsung remote.
 *
 * The vendor connects lazily on the first key send, so `ready` means that a
 * remote is configured and available rather than that its WebSocket is open.
 */
export class SamsungClient {
    callbacks;
    remote;
    options;
    state = 'disconnected';
    generation = 0;
    pendingDelays = new Map();
    pendingRequests = new Set();
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    get connectionState() {
        return this.state;
    }
    get isConfigured() {
        return this.remote !== undefined && this.state !== 'disposed';
    }
    connect(options) {
        if (this.state === 'disposed') {
            throw new Error('Samsung client has been disposed');
        }
        this.generation++;
        this.cancelPendingOperations();
        this.disconnectRemote();
        this.options = { ...options };
        this.setState('connecting');
        this.callbacks.log('debug', 'Creating remote for TV at ' + options.host);
        this.remote = new SamsungTvRemote({
            ip: options.host,
            mac: options.macAddress,
            name: 'Bitfocus Connection',
            port: options.port,
        });
        this.setState('ready');
    }
    reconnect() {
        if (!this.options || this.state === 'disposed') {
            return;
        }
        this.connect(this.options);
    }
    disconnect() {
        if (this.state === 'disposed') {
            return;
        }
        this.generation++;
        this.cancelPendingOperations();
        this.disconnectRemote();
        this.setState('disconnected');
    }
    dispose() {
        if (this.state === 'disposed') {
            return;
        }
        this.generation++;
        this.cancelPendingOperations();
        this.disconnectRemote();
        this.options = undefined;
        this.setState('disposed');
    }
    async fetchDevicePowerState() {
        const options = this.options;
        if (!options || this.state === 'disposed') {
            return null;
        }
        const url = `http://${options.host}:${DEVICE_REST_PORT}${DEVICE_API_PATH}`;
        const controller = new AbortController();
        this.pendingRequests.add(controller);
        const timeout = setTimeout(() => controller.abort(), POWER_STATE_FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                this.callbacks.log('debug', `Device API ${url} returned HTTP ${response.status}`);
                return null;
            }
            const data = (await response.json());
            const raw = data.device?.PowerState;
            if (typeof raw !== 'string') {
                this.callbacks.log('debug', 'Device API response had no PowerState');
                return null;
            }
            return raw.trim().toLowerCase() === 'on' ? 'on' : 'standby';
        }
        catch (error) {
            this.callbacks.log('debug', `Could not read device power state from ${url}: ${this.errorMessage(error)}`);
            return null;
        }
        finally {
            clearTimeout(timeout);
            this.pendingRequests.delete(controller);
        }
    }
    /**
     * Attempts to send a key using the configured remote.
     *
     * A `true` result means the send was attempted, not that the TV confirmed
     * delivery. Post-attempt errors remain non-fatal to preserve module behavior.
     */
    async sendKey(key) {
        if (!key || !(key in Keys)) {
            this.callbacks.log('error', `Cannot send key — invalid or missing key: ${String(key)}`);
            return false;
        }
        const remote = this.remote;
        if (!remote || this.state === 'disposed') {
            this.callbacks.log('error', 'Cannot send key — no TV connection configured');
            return false;
        }
        this.callbacks.log('debug', `Sending key: ${key}`);
        const sendTimeout = this.createDelay(SEND_KEY_TIMEOUT_MS);
        try {
            await Promise.race([remote.sendKey(key), sendTimeout.promise]);
        }
        catch (error) {
            this.callbacks.log('debug', `sendKey(${key}) settled with a non-fatal error (command already fired): ${this.errorMessage(error)}`);
        }
        finally {
            sendTimeout.cancel();
        }
        return true;
    }
    async wakeAndReconnect() {
        const remote = this.remote;
        if (!remote || this.state === 'disposed') {
            this.callbacks.log('error', 'No TV connection configured');
            return;
        }
        const operationGeneration = this.generation;
        this.callbacks.log('debug', 'Could not read PowerState from device API; sending Wake-on-LAN to: ' + this.options?.macAddress);
        try {
            await remote.wakeTV();
        }
        catch (error) {
            this.callbacks.log('error', 'Wake-on-LAN failed: ' + this.errorMessage(error));
            return;
        }
        if (operationGeneration !== this.generation)
            return;
        this.callbacks.log('debug', 'Waiting for TV to boot...');
        await this.createDelay(WAKE_RECONNECT_DELAY_MS).promise;
        if (operationGeneration !== this.generation)
            return;
        this.callbacks.log('debug', 'Re-establishing WebSocket connection...');
        this.reconnect();
    }
    disconnectRemote() {
        this.remote?.disconnect();
        this.remote = undefined;
    }
    setState(state) {
        this.state = state;
        this.callbacks.onStateChanged?.(state);
    }
    createDelay(ms) {
        let timer;
        let settle = () => undefined;
        const promise = new Promise((resolve) => {
            settle = () => {
                clearTimeout(timer);
                this.pendingDelays.delete(timer);
                resolve();
            };
            timer = setTimeout(settle, ms);
            this.pendingDelays.set(timer, settle);
        });
        return { promise, cancel: settle };
    }
    cancelPendingOperations() {
        for (const settle of [...this.pendingDelays.values()])
            settle();
        for (const controller of this.pendingRequests)
            controller.abort();
        this.pendingRequests.clear();
    }
    errorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
}
//# sourceMappingURL=SamsungClient.js.map