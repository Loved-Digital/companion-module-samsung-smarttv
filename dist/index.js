import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base';
import { getAwakeSamsungDevices } from './vendor/samsung-tv-remote/index.js';
import { updateActions } from './actions.js';
import { updateVariableDefinitions } from './variables.js';
import { defineConfigFields } from './config.js';
import { SamsungClient } from './samsung/SamsungClient.js';
function formatDiscoveredSamsungDevice(device) {
    const friendlyName = device.friendlyName?.trim() || 'Unknown';
    return `${friendlyName} (IP: ${device.ip}, MAC: ${device.mac})`;
}
export class ModuleInstance extends InstanceBase {
    samsungClient;
    config;
    constructor(internal) {
        super(internal);
        this.samsungClient = new SamsungClient({
            log: (level, message) => this.log(level, message),
            onStateChanged: (state) => this.handleClientStateChanged(state),
        });
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
        if (!this.config.host || !this.config.macAddress) {
            this.samsungClient.disconnect();
            this.updateStatus(InstanceStatus.BadConfig, 'IP and MAC address are required');
            return;
        }
        this.samsungClient.connect({
            host: this.config.host,
            macAddress: this.config.macAddress,
            port: this.config.port ?? 8002,
        });
    }
    /**
     * Reads `device.PowerState` from the TV REST API. Returns `null` if the request fails
     * (e.g. TV fully powered down and not reachable on the network).
     */
    async fetchDevicePowerState() {
        return this.samsungClient.fetchDevicePowerState();
    }
    async sendKey(key) {
        const sendWasAttempted = await this.samsungClient.sendKey(key);
        if (sendWasAttempted) {
            this.updateStatus(InstanceStatus.Ok);
        }
    }
    async wakeAndReconnect() {
        await this.samsungClient.wakeAndReconnect();
    }
    async destroy() {
        this.samsungClient.dispose();
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
    handleClientStateChanged(state) {
        if (state === 'connecting')
            this.updateStatus(InstanceStatus.Connecting);
        if (state === 'ready')
            this.updateStatus(InstanceStatus.Ok);
    }
}
runEntrypoint(ModuleInstance, []);
//# sourceMappingURL=index.js.map