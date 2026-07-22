"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = require("node:readline");
const discovery_1 = require("./discovery");
const keys_1 = require("./keys");
const remote_1 = require("./remote");
const KEYS_MAP = {
    '0': keys_1.Keys.KEY_0,
    '1': keys_1.Keys.KEY_1,
    '2': keys_1.Keys.KEY_2,
    '3': keys_1.Keys.KEY_3,
    '4': keys_1.Keys.KEY_4,
    '5': keys_1.Keys.KEY_5,
    '6': keys_1.Keys.KEY_6,
    '7': keys_1.Keys.KEY_7,
    '8': keys_1.Keys.KEY_8,
    '9': keys_1.Keys.KEY_9,
    '+': keys_1.Keys.KEY_VOLUP,
    '-': keys_1.Keys.KEY_VOLDOWN,
    p: keys_1.Keys.KEY_PLAY,
    w: keys_1.Keys.KEY_CHUP,
    s: keys_1.Keys.KEY_CHDOWN,
    q: keys_1.Keys.KEY_POWER,
    '\r': keys_1.Keys.KEY_ENTER, // Return
    '\u001b[A': keys_1.Keys.KEY_UP, // Up
    '\u001b[B': keys_1.Keys.KEY_DOWN, // Down
    '\u001b[C': keys_1.Keys.KEY_RIGHT, // Right
    '\u001b[D': keys_1.Keys.KEY_LEFT, // Left
    '\u007f': keys_1.Keys.KEY_RETURN, // Backspace
    '\u001b': keys_1.Keys.KEY_HOME // Escape
};
const cyan = (message) => process.stdout.isTTY ? `\x1b[36m${message}\x1b[0m` : message;
const gray = (message) => process.stdout.isTTY ? `\x1b[90m${message}\x1b[0m` : message;
const magenta = (message) => process.stdout.isTTY ? `\x1b[35m${message}\x1b[0m` : message;
const yellow = (message) => process.stdout.isTTY ? `\x1b[33m${message}\x1b[0m` : message;
const deviceLabel = (device) => { var _a; return `${(_a = device.friendlyName) !== null && _a !== void 0 ? _a : 'Unknown'} ${gray(`(ip: ${device.ip}, mac: ${device.mac})`)}`; };
const displayHelp = () => {
    console.log(cyan('Usage'));
    console.log(`  Arrows (${yellow('←/↑/↓/→')})`);
    console.log(`  Channel (${yellow('w/s')})`);
    console.log(`  Enter (${yellow('Enter')})`);
    console.log(`  Home (${yellow('Escape')})`);
    console.log(`  Numbers (${yellow('[0-9]')})`);
    console.log(`  Play (${yellow('p')})`);
    console.log(`  Power (${yellow('q')})`);
    console.log(`  Return (${yellow('Backspace')})`);
    console.log(`  Volume (${yellow('+/-')})\n`);
};
const askQuestion = (question) => new Promise(resolve => {
    const readline = (0, node_readline_1.createInterface)({
        input: process.stdin,
        output: process.stdout
    });
    readline.question(question, res => {
        const numberOfLines = question.split('\n').length;
        (0, node_readline_1.moveCursor)(process.stdout, 0, -numberOfLines);
        (0, node_readline_1.clearScreenDown)(process.stdout);
        resolve(res);
        readline.close();
    });
});
const chooseDevice = (devices) => __awaiter(void 0, void 0, void 0, function* () {
    let question = cyan('? Select device\n');
    devices.forEach((device, index) => {
        question += `  ${index + 1}) ${deviceLabel(device)}\n`;
    });
    question += '\nYour choice: ';
    return Number(yield askQuestion(question));
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    if (process.argv.includes('--version') || process.argv.includes('-v')) {
        console.log(process.env.npm_package_version);
        process.exit();
    }
    console.log(magenta('[SamsungTvRemote]\n'));
    displayHelp();
    try {
        let selectedDevice;
        let isDeviceAwake = false;
        const devices = yield (0, discovery_1.getAwakeSamsungDevices)();
        if (devices.length) {
            const selectedDeviceIndex = 0;
            if (devices.length > 1) {
                let deviceIndex = yield chooseDevice(devices);
                while (typeof deviceIndex !== 'number' || deviceIndex <= 0 || deviceIndex > devices.length) {
                    deviceIndex = yield chooseDevice(devices);
                }
                deviceIndex--;
            }
            selectedDevice = devices[selectedDeviceIndex];
            isDeviceAwake = true;
            const label = devices.length > 1 ? 'Selected awake device' : 'Awake device found';
            console.log(`${cyan(`> ${label}:`)} ${deviceLabel(selectedDevice)}`);
        }
        else {
            console.log(yellow("> Couldn't find any awake Samsung devices"));
            selectedDevice = (0, discovery_1.getLastConnectedDevice)();
            if (selectedDevice) {
                console.log(`${cyan('> Last connected device found:')} ${deviceLabel(selectedDevice)}`);
            }
            else {
                console.log(yellow("> Couldn't find any last connected device"));
                process.exit(-1);
            }
        }
        const remote = new remote_1.SamsungTvRemote({ device: selectedDevice, keysDelay: 0 });
        if (!isDeviceAwake) {
            console.log(`${cyan('> Waking TV...')}`);
            yield remote.wakeTV();
        }
        //
        console.log(cyan('\n? Press any key: '));
        (0, node_readline_1.createInterface)({ input: process.stdin }); // avoid keys to be displayed
        (0, node_readline_1.emitKeypressEvents)(process.stdin); // allow keypress events
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true); // allow raw-mode to catch character by character
        }
        process.stdin.on('keypress', (_str, key) => __awaiter(void 0, void 0, void 0, function* () {
            if (key.sequence in KEYS_MAP) {
                console.log(`${cyan('>')} sending...`, gray(KEYS_MAP[key.sequence]));
                yield remote.sendKey(KEYS_MAP[key.sequence]);
                setTimeout(() => {
                    (0, node_readline_1.moveCursor)(process.stdout, 0, -1);
                    (0, node_readline_1.clearScreenDown)(process.stdout);
                }, 250);
            }
            if ((key.ctrl && key.name === 'c') || key.name === 'q' || key.name === 'f') {
                process.exit();
            }
        }));
    }
    catch (error) {
        console.log('');
        console.error(error);
    }
}))();
