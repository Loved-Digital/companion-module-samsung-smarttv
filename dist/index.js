import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base';
import { SamsungTvRemote, Keys, getAwakeSamsungDevices } from 'samsung-tv-remote';
import { updateActions } from './actions.js';
import { updateVariableDefinitions } from './variables.js';
import { defineConfigFields } from './config.js';
/** Port for Samsung REST device info (`/api/v2`), not the WebSocket remote port. */
const DEVICE_REST_PORT = 8001;
const DEVICE_API_PATH = '/api/v2/';
const POWER_STATE_FETCH_TIMEOUT_MS = 5000;
/** Cap on how long we await `tv.sendKey` before resolving, to stay under Companion's ~5s IPC timeout. */
const SEND_KEY_TIMEOUT_MS = 2000;
function formatDiscoveredSamsungDevice(device) {
    const friendlyName = device.friendlyName?.trim() || 'Unknown';
    return `${friendlyName} (IP: ${device.ip}, MAC: ${device.mac})`;
}
export class ModuleInstance extends InstanceBase {
    tv;
    config;
    constructor(internal) {
        super(internal);
    }
    async init(config, _isFirstInit) {
        this.config = config;
        const devices = await getAwakeSamsungDevices();
        if (devices.length) {
            const list = devices.map(formatDiscoveredSamsungDevice).join('\n');
            this.log('debug', 'Found Samsung TV devices on network:\n' + list);
        }
        else {
            this.log('debug', 'No Samsung TV devices found on network');
        }
        if (!this.config.host) {
            this.updateStatus(InstanceStatus.BadConfig, 'IP address not set');
            return;
        }
        if (!this.config.macAddress) {
            this.updateStatus(InstanceStatus.BadConfig, 'MAC address not set');
            return;
        }
        this.updateActions();
        this.updateVariableDefinitions();
        this.establishConnection();
    }
    establishConnection() {
        this.updateStatus(InstanceStatus.Connecting);
        if (this.tv) {
            this.tv.disconnect();
            this.tv = undefined;
        }
        if (!this.config.host || !this.config.macAddress) {
            this.updateStatus(InstanceStatus.BadConfig, 'IP and MAC address are required');
            return;
        }
        this.log('debug', 'Creating remote for TV at ' + this.config.host);
        this.tv = new SamsungTvRemote({
            ip: this.config.host,
            mac: this.config.macAddress,
            name: 'Bitfocus Connection',
            port: this.config.port ?? 8002,
        });
        this.updateStatus(InstanceStatus.Ok);
    }
    /**
     * Reads `device.PowerState` from the TV REST API. Returns `null` if the request fails
     * (e.g. TV fully powered down and not reachable on the network).
     */
    async fetchDevicePowerState() {
        if (!this.config.host) {
            return null;
        }
        const url = `http://${this.config.host}:${DEVICE_REST_PORT}${DEVICE_API_PATH}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), POWER_STATE_FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) {
                this.log('debug', `Device API ${url} returned HTTP ${res.status}`);
                return null;
            }
            const data = (await res.json());
            const raw = data.device?.PowerState;
            if (typeof raw !== 'string') {
                this.log('debug', 'Device API response had no PowerState');
                return null;
            }
            return raw.trim().toLowerCase() === 'on' ? 'on' : 'standby';
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.log('debug', `Could not read device power state from ${url}: ${message}`);
            return null;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async sendKey(key) {
        if (!key || !(key in Keys)) {
            this.log('error', `Cannot send key — invalid or missing key: ${String(key)}`);
            return;
        }
        if (!this.tv) {
            this.log('error', 'Cannot send key — no TV connection configured');
            return;
        }
        this.log('debug', `Sending key: ${key}`);
        // samsung-tv-remote writes the key to the WebSocket immediately, but its promise can
        // hang (or only settle after an internal keysDelay). Companion's IPC wrapper aborts the
        // action after ~5s and reports "Call timed out" even though the TV already received the
        // command. Race the send against a short timeout so we always resolve well before that
        // IPC deadline — a timeout here means the command was fired, not that it failed.
        try {
            await Promise.race([
                this.tv.sendKey(key),
                new Promise((resolve) => setTimeout(resolve, SEND_KEY_TIMEOUT_MS)),
            ]);
        }
        catch (err) {
            // The key has already been written to the WebSocket, so treat any post-send error
            // (including IPC-layer timeouts) as non-fatal rather than surfacing a false failure.
            const message = err instanceof Error ? err.message : String(err);
            this.log('debug', `sendKey(${key}) settled with a non-fatal error (command already fired): ${message}`);
        }
        // Firing the command is success — mark Ok rather than waiting for confirmation.
        this.updateStatus(InstanceStatus.Ok);
    }
    async destroy() {
        if (this.tv) {
            this.tv.disconnect();
            this.tv = undefined;
        }
    }
    async configUpdated(config) {
        const needsReconnect = config.host !== this.config.host ||
            config.port !== this.config.port ||
            config.macAddress !== this.config.macAddress;
        this.config = config;
        if (needsReconnect) {
            this.establishConnection();
        }
    }
    getConfigFields() {
        return defineConfigFields();
    }
    updateActions() {
        updateActions(this);
    }
    updateVariableDefinitions() {
        updateVariableDefinitions(this);
    }
}
runEntrypoint(ModuleInstance, []);
//# sourceMappingURL=index.js.map