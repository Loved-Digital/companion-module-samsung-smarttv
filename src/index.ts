import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from '@companion-module/base'
import { Keys, getAwakeSamsungDevices, type SamsungDevice } from './vendor/samsung-tv-remote/index.js'
import { updateActions } from './actions.js'
import { updateVariableDefinitions } from './variables.js'
import { defineConfigFields, SamsungConfig } from './config.js'
import { SamsungClient, type DevicePowerState, type SamsungClientState } from './samsung/SamsungClient.js'

function formatDiscoveredSamsungDevice(device: SamsungDevice): string {
	const friendlyName = device.friendlyName?.trim() || 'Unknown'
	return `${friendlyName} (IP: ${device.ip}, MAC: ${device.mac})`
}

export class ModuleInstance extends InstanceBase<SamsungConfig> {
	private readonly samsungClient: SamsungClient
	config!: SamsungConfig

	constructor(internal: unknown) {
		super(internal)
		this.samsungClient = new SamsungClient({
			log: (level, message) => this.log(level, message),
			onStateChanged: (state) => this.handleClientStateChanged(state),
		})
	}

	async init(config: SamsungConfig, _isFirstInit: boolean): Promise<void> {
		this.config = config

		const devices = await getAwakeSamsungDevices()
		if (devices.length) {
			const list = devices.map(formatDiscoveredSamsungDevice).join('\n')
			this.log('debug', 'Found Samsung TV devices on network:\n' + list)
		} else {
			this.log('debug', 'No Samsung TV devices found on network')
		}

		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'IP address not set')
			return
		}
		if (!this.config.macAddress) {
			this.updateStatus(InstanceStatus.BadConfig, 'MAC address not set')
			return
		}

		this.updateActions()
		this.updateVariableDefinitions()
		this.establishConnection()
	}

	establishConnection(): void {
		this.updateStatus(InstanceStatus.Connecting)

		if (!this.config.host || !this.config.macAddress) {
			this.samsungClient.disconnect()
			this.updateStatus(InstanceStatus.BadConfig, 'IP and MAC address are required')
			return
		}

		this.samsungClient.connect({
			host: this.config.host,
			macAddress: this.config.macAddress,
			port: this.config.port ?? 8002,
		})
	}

	/**
	 * Reads `device.PowerState` from the TV REST API. Returns `null` if the request fails
	 * (e.g. TV fully powered down and not reachable on the network).
	 */
	async fetchDevicePowerState(): Promise<DevicePowerState | null> {
		return this.samsungClient.fetchDevicePowerState()
	}

	async sendKey(key: keyof typeof Keys): Promise<void> {
		const sendWasAttempted = await this.samsungClient.sendKey(key)
		if (sendWasAttempted) {
			this.updateStatus(InstanceStatus.Ok)
		}
	}

	async wakeAndReconnect(): Promise<void> {
		await this.samsungClient.wakeAndReconnect()
	}

	async destroy(): Promise<void> {
		this.samsungClient.dispose()
	}

	async configUpdated(config: SamsungConfig): Promise<void> {
		const needsReconnect =
			config.host !== this.config.host ||
			config.port !== this.config.port ||
			config.macAddress !== this.config.macAddress

		this.config = config

		if (needsReconnect) {
			this.establishConnection()
		}
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return defineConfigFields()
	}

	updateActions(): void {
		updateActions(this)
	}

	updateVariableDefinitions(): void {
		updateVariableDefinitions(this)
	}

	private handleClientStateChanged(state: SamsungClientState): void {
		if (state === 'connecting') this.updateStatus(InstanceStatus.Connecting)
		if (state === 'ready') this.updateStatus(InstanceStatus.Ok)
	}
}

runEntrypoint(ModuleInstance, [])
