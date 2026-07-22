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
exports.getAwakeSamsungDevices = exports.getLastConnectedDevice = void 0;
const node_dgram_1 = require("node:dgram");
const cache_1 = require("./cache");
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)('SamsungTvDiscovery');
const SSDP_MSEARCH = [
    'M-SEARCH * HTTP/1.1',
    'HOST: 239.255.255.250:1900',
    'MAN: "ssdp:discover"',
    'MX: 10',
    'ST: urn:dial-multiscreen-org:service:dial:1',
    '',
    ''
].join('\r\n');
/**
 * Searches for last connected device, if any.
 *
 * @returns {SamsungDevice | undefined} The device if found, or undefined otherwise
 */
const getLastConnectedDevice = () => {
    logger.info('🔍 Searching for a last connected device...');
    const device = (0, cache_1.getDeviceFromCache)();
    if (!device) {
        logger.warn('No last connected device found');
    }
    else {
        logger.info('✅ Found last connected device:', device);
    }
    return device;
};
exports.getLastConnectedDevice = getLastConnectedDevice;
/**
 * Retrieves a list of Samsung devices that are currently awake and reachable on the network.
 *
 * @async
 * @param {number} [timeout=500] The maximum time in milliseconds to wait for the response
 * @returns {Promise<SamsungDevice[]>} A promise that resolves with an array of awake Samsung devices
 */
const getAwakeSamsungDevices = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (timeout = 500) {
    logger.info('🔍 Searching for awake Samsung devices...');
    return new Promise(resolve => {
        const devices = [];
        const socket = (0, node_dgram_1.createSocket)('udp4');
        const resolveWithDevices = () => {
            if (!devices.length) {
                logger.warn('No Samsung devices found');
            }
            resolve(devices);
        };
        socket.on('listening', () => {
            const address = socket.address();
            logger.debug(`Listening on '${address.address}:${address.port}'...`);
            // Send M-SEARCH message
            const message = Buffer.from(SSDP_MSEARCH);
            socket.setBroadcast(true);
            socket.setMulticastTTL(2); // 2, to limit to local network
            logger.debug('Sending M-SEARCH message...');
            socket.send(message, 0, message.length, 1900, '239.255.255.250', error => {
                if (error) {
                    logger.error('Failed:', error);
                    socket.close();
                    resolveWithDevices();
                }
            });
        });
        socket.on('message', (message, remoteInfo) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const response = messageToJson(message);
            logger.debug(`Received message from '${remoteInfo.address}:${remoteInfo.port}':\n`, response);
            if ((_a = response.SERVER) === null || _a === void 0 ? void 0 : _a.includes('Samsung')) {
                const device = {
                    friendlyName: 'Unknown',
                    ip: remoteInfo.address,
                    mac: '00:00:00:00:00:00'
                };
                if (response.LOCATION) {
                    try {
                        const result = yield (yield fetch(response.LOCATION)).text();
                        const regexp = /<friendlyName>(.*?)<\/friendlyName>/gi;
                        device.friendlyName = (_c = (_b = [...result.matchAll(regexp)]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c[1];
                    }
                    catch (_d) {
                        /** swallow any error as it is not relevant nor blocking */
                    }
                }
                if (response.WAKEUP) {
                    const result = response.WAKEUP.match(/\s*MAC=([0-9a-fA-F:]+)/);
                    if (result) {
                        device.mac = result[1];
                    }
                }
                logger.info('✅ Found Samsung device:', device);
                devices.push(device);
            }
        }));
        socket.on('error', error => {
            logger.error('Socket error:', error);
            socket.close();
            resolveWithDevices();
        });
        socket.bind();
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            if (devices.length > 0 || elapsedTime >= timeout) {
                try {
                    socket.close();
                }
                catch (_a) {
                    /** in case it was already closed with errors */
                }
                clearInterval(interval);
                resolveWithDevices();
            }
        }, 25);
    });
});
exports.getAwakeSamsungDevices = getAwakeSamsungDevices;
// --- HELPER(s) ---
const messageToJson = (message) => message
    .toString()
    .split('\n')
    .reduce((acc, line) => {
    const spos = line.indexOf(':');
    if (spos < 0)
        return acc; // If there's no colon, skip the line
    const key = line.substring(0, spos).trim().toUpperCase();
    const value = line.substring(spos + 1).trim();
    acc[key] = value;
    return acc;
}, {});
