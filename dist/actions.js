import { Keys } from './vendor/samsung-tv-remote/index.js';
const KEY_CHOICES = Object.keys(Keys).map((key) => ({ label: key, id: key }));
export function updateActions(self) {
    self.setActionDefinitions({
        power: {
            name: 'Set Power State',
            options: [
                {
                    id: 'power',
                    type: 'dropdown',
                    label: 'On/Off',
                    default: 'powerOn',
                    choices: [
                        { label: 'Power On', id: 'powerOn' },
                        { label: 'Power Off', id: 'powerOff' },
                    ],
                },
            ],
            callback: async (event) => {
                const powerState = await self.fetchDevicePowerState();
                if (event.options.power === 'powerOn') {
                    if (powerState === 'on') {
                        self.log('debug', 'Power on skipped: device API reports PowerState is already on');
                        return;
                    }
                    if (powerState === 'standby') {
                        self.log('debug', 'Power on: device is in standby — sending KEY_POWER');
                        await self.sendKey('KEY_POWER');
                        return;
                    }
                    // API unreachable, fall back to Wake-on-LAN.
                    await self.wakeAndReconnect();
                }
                else {
                    if (powerState !== 'on') {
                        self.log('debug', 'Power off skipped: device API does not report PowerState on (already standby/off or unreachable)');
                        return;
                    }
                    self.log('debug', 'Power off: sending KEY_POWER');
                    await self.sendKey('KEY_POWER');
                }
            },
        },
        sendButton: {
            name: 'Send Button Command',
            options: [
                {
                    id: 'remoteButton',
                    type: 'dropdown',
                    label: 'Select Button',
                    default: 'KEY_MENU',
                    choices: KEY_CHOICES,
                },
            ],
            callback: async (event) => {
                const remoteButton = event.options.remoteButton;
                await self.sendKey(remoteButton);
            },
        },
    });
}
//# sourceMappingURL=actions.js.map