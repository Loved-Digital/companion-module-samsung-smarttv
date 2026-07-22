import { SamsungClient } from '../dist/samsung/SamsungClient.js'

const host = process.env.SAMSUNG_TV_HOST?.trim()
const macAddress = process.env.SAMSUNG_TV_MAC?.trim()
const portValue = process.env.SAMSUNG_TV_PORT?.trim() || '8002'
const key = process.env.SAMSUNG_TV_KEY?.trim() || 'KEY_VOLUP'

if (!host || !macAddress) {
	console.error(`Missing Samsung TV configuration.

Set SAMSUNG_TV_HOST and SAMSUNG_TV_MAC before running this smoke test.
Optional: SAMSUNG_TV_PORT (default: 8002) and SAMSUNG_TV_KEY (default: KEY_VOLUP).

Example:
  SAMSUNG_TV_HOST=192.168.1.100 SAMSUNG_TV_MAC=AA:BB:CC:DD:EE:FF yarn test:samsung-key`)
	process.exitCode = 1
} else {
	const port = Number(portValue)
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		console.error(`Invalid SAMSUNG_TV_PORT: ${portValue}. Expected an integer from 1 to 65535.`)
		process.exitCode = 1
	} else {
		const client = new SamsungClient({
			log: (level, message) => console[level](message),
			onStateChanged: (state) => console.log(`SamsungClient state: ${state}`),
		})

		try {
			client.connect({ host, macAddress, port })
			const sendWasAttempted = await client.sendKey(key)
			console.log(`Send attempted: ${sendWasAttempted}`)
			if (!sendWasAttempted) process.exitCode = 1
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			console.error(`Samsung key smoke test failed: ${message}`)
			process.exitCode = 1
		} finally {
			client.dispose()
		}
	}
}
