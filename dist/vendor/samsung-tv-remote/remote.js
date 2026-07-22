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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SamsungTvRemote_instances, _SamsungTvRemote_options, _SamsungTvRemote_connectingPromise, _SamsungTvRemote_webSocketURL, _SamsungTvRemote_webSocket, _SamsungTvRemote_appToken, _SamsungTvRemote_delay, _SamsungTvRemote_getAppToken, _SamsungTvRemote_refreshWebSocketURL, _SamsungTvRemote_isTvAlive, _SamsungTvRemote_disconnectFromTV, _SamsungTvRemote_connectToTV;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamsungTvRemote = void 0;
const node_child_process_1 = require("node:child_process");
const wake_on_lan_1 = require("wake_on_lan");
const ws_1 = __importDefault(require("ws"));
const cache_1 = require("./cache");
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)();
const DEFAULT_OPTIONS = {
    name: 'SamsungTvRemote',
    mac: '00:00:00:00:00:00',
    port: 8002,
    timeout: 5000,
    keysDelay: 60
};
class SamsungTvRemote {
    constructor(options) {
        _SamsungTvRemote_instances.add(this);
        _SamsungTvRemote_options.set(this, void 0);
        _SamsungTvRemote_connectingPromise.set(this, null);
        _SamsungTvRemote_webSocketURL.set(this, void 0);
        _SamsungTvRemote_webSocket.set(this, null);
        _SamsungTvRemote_appToken.set(this, void 0);
        // Initialize
        __classPrivateFieldSet(this, _SamsungTvRemote_options, Object.assign(Object.assign({ 
            // @ts-expect-error This is made only for keys ordering during the logs
            name: undefined, 
            // @ts-expect-error This is made only for keys ordering during the logs
            ip: undefined }, DEFAULT_OPTIONS), options), "f");
        if (options.device) {
            __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip = options.device.ip;
            __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").mac = options.device.mac;
        }
        if (!__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip) {
            throw new Error('TV IP address is required');
        }
        logger.info('Remote starting...');
        logger.debug(__classPrivateFieldGet(this, _SamsungTvRemote_options, "f"));
        // Retrieve app token (if previously registered)
        __classPrivateFieldSet(this, _SamsungTvRemote_appToken, __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_getAppToken).call(this, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").port, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").name), "f");
        // Initialize web socket url
        __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_refreshWebSocketURL).call(this);
    }
    // --- PUBLIC API(s) ---
    /**
     * Sends a key to the TV.
     *
     * @async
     * @param {keyof typeof Keys} key The key to be sent
     * @returns {Promise<void>} A void promise
     */
    sendKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (key) {
                yield __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_connectToTV).call(this);
                yield __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_delay).call(this, 300);
                logger.info('ðŸ“¡ Sending key...', key);
                (_a = __classPrivateFieldGet(this, _SamsungTvRemote_webSocket, "f")) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                    method: 'ms.remote.control',
                    params: {
                        Cmd: 'Click',
                        DataOfCmd: key,
                        Option: false,
                        TypeOfRemote: 'SendRemoteKey'
                    }
                }));
                // Gives a delay before the next command
                yield __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_delay).call(this, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").keysDelay);
            }
        });
    }
    /**
     * Sends multiple keys to the TV.
     *
     * @async
     * @param {(keyof typeof Keys)[]} keys An array of keys to be sent
     * @returns {Promise<void>} A void promise
     */
    sendKeys(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of keys) {
                yield this.sendKey(key);
            }
        });
    }
    /**
     * Turns the TV on or awaken it from sleep mode (also called WoL - Wake-on-LAN).
     *
     * The mac address option is required in this case.
     *
     * @async
     * @returns {Promise<void>} A void promise
     */
    wakeTV() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_isTvAlive).call(this)) {
                logger.info('ðŸ’¤ Waking TV... already up');
                return;
            }
            logger.info('ðŸ’¤ Waking TV...');
            if (!__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").mac) {
                throw new Error('TV mac address is required');
            }
            return new Promise((resolve, reject) => {
                (0, wake_on_lan_1.wake)(__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").mac, { num_packets: 30 }, (error) => __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        return reject(error);
                    }
                    else {
                        // Gives a little time for the TV to start
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            if (!(yield __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_isTvAlive).call(this))) {
                                return reject(new Error("TV won't wake up"));
                            }
                            return resolve();
                        }), 5000);
                    }
                }));
            });
        });
    }
    /**
     * Closes the connection to the TV.
     *
     * It doesn't shut down the TV - it only closes the connection to it.
     */
    disconnect() {
        logger.info('ðŸ“º Disconnecting from TV...');
        __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_disconnectFromTV).call(this);
    }
}
exports.SamsungTvRemote = SamsungTvRemote;
_SamsungTvRemote_options = new WeakMap(), _SamsungTvRemote_connectingPromise = new WeakMap(), _SamsungTvRemote_webSocketURL = new WeakMap(), _SamsungTvRemote_webSocket = new WeakMap(), _SamsungTvRemote_appToken = new WeakMap(), _SamsungTvRemote_instances = new WeakSet(), _SamsungTvRemote_delay = function _SamsungTvRemote_delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}, _SamsungTvRemote_getAppToken = function _SamsungTvRemote_getAppToken(ip, port, appName) {
    let value;
    const app = (0, cache_1.getAppFromCache)(appName);
    if (app && typeof app === 'object' && Object.hasOwn(app, `${ip}:${String(port)}`)) {
        value = app[`${ip}:${String(port)}`];
    }
    if (value) {
        logger.info('âœ… App token found:', value);
    }
    else {
        logger.warn('No token found: app is not registered yet and will need to be authorized on TV');
    }
    return value;
}, _SamsungTvRemote_refreshWebSocketURL = function _SamsungTvRemote_refreshWebSocketURL() {
    let url = __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").port === 8001 ? 'ws' : 'wss';
    url += `://${__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip}:${__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").port}/api/v2/channels/samsung.remote.control`;
    url += `?name=${Buffer.from(__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").name).toString('base64')}`;
    if (__classPrivateFieldGet(this, _SamsungTvRemote_appToken, "f")) {
        url += `&token=${__classPrivateFieldGet(this, _SamsungTvRemote_appToken, "f")}`;
    }
    __classPrivateFieldSet(this, _SamsungTvRemote_webSocketURL, url, "f");
}, _SamsungTvRemote_isTvAlive = function _SamsungTvRemote_isTvAlive() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            (0, node_child_process_1.exec)(`ping -c 1 -W 1 ${__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip}`, error => resolve(!error));
        });
    });
}, _SamsungTvRemote_disconnectFromTV = function _SamsungTvRemote_disconnectFromTV() {
    var _a, _b;
    (_a = __classPrivateFieldGet(this, _SamsungTvRemote_webSocket, "f")) === null || _a === void 0 ? void 0 : _a.removeAllListeners();
    (_b = __classPrivateFieldGet(this, _SamsungTvRemote_webSocket, "f")) === null || _b === void 0 ? void 0 : _b.close();
    __classPrivateFieldSet(this, _SamsungTvRemote_webSocket, null, "f");
    __classPrivateFieldSet(this, _SamsungTvRemote_connectingPromise, null, "f");
}, _SamsungTvRemote_connectToTV = function _SamsungTvRemote_connectToTV() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // If already connected -> returns immediately
        if (((_a = __classPrivateFieldGet(this, _SamsungTvRemote_webSocket, "f")) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN) {
            return Promise.resolve();
        }
        // If already in progress -> returns the promise
        if (__classPrivateFieldGet(this, _SamsungTvRemote_connectingPromise, "f")) {
            return __classPrivateFieldGet(this, _SamsungTvRemote_connectingPromise, "f");
        }
        // Otherwise -> starts new connection
        __classPrivateFieldSet(this, _SamsungTvRemote_connectingPromise, new Promise((resolve, reject) => {
            logger.info('ðŸ“º Connecting to TV...');
            logger.debug('Using websocket:', __classPrivateFieldGet(this, _SamsungTvRemote_webSocketURL, "f"));
            const _webSocket = new ws_1.default(__classPrivateFieldGet(this, _SamsungTvRemote_webSocketURL, "f"), {
                timeout: __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").timeout,
                handshakeTimeout: __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").timeout,
                rejectUnauthorized: false
            });
            const cleanup = () => {
                _webSocket === null || _webSocket === void 0 ? void 0 : _webSocket.removeAllListeners();
                __classPrivateFieldSet(this, _SamsungTvRemote_connectingPromise, null, "f");
            };
            _webSocket.on('error', (error) => {
                cleanup();
                __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_disconnectFromTV).call(this);
                if (error.code === 'ETIMEDOUT') {
                    reject(new Error('Connection timed out'));
                }
                else if (error.code === 'EHOSTDOWN') {
                    reject(new Error('Host is down or service not available'));
                }
                else if (error.code === 'EHOSTUNREACH') {
                    reject(new Error('Host is unreachable'));
                }
                else {
                    reject(error);
                }
            });
            _webSocket.on('close', () => {
                cleanup();
                __classPrivateFieldSet(this, _SamsungTvRemote_webSocket, null, "f");
            });
            _webSocket.once('message', data => {
                var _a, _b, _c;
                const message = JSON.parse(data.toString());
                if (message.event === 'ms.channel.connect') {
                    logger.info('âœ… Connected to TV');
                    // Save token for next time (if not already in cache)
                    if (!__classPrivateFieldGet(this, _SamsungTvRemote_appToken, "f") && ((_a = message.data) === null || _a === void 0 ? void 0 : _a.token)) {
                        __classPrivateFieldSet(this, _SamsungTvRemote_appToken, message.data.token, "f");
                        __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_refreshWebSocketURL).call(this);
                        (0, cache_1.saveAppToCache)(__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").port, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").name, message.data.token);
                    }
                    // Save device for next time
                    const deviceName = (_c = (_b = __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").device) === null || _b === void 0 ? void 0 : _b.friendlyName) !== null && _c !== void 0 ? _c : 'Unknown';
                    (0, cache_1.saveDeviceToCache)(__classPrivateFieldGet(this, _SamsungTvRemote_options, "f").ip, __classPrivateFieldGet(this, _SamsungTvRemote_options, "f").mac, deviceName);
                    __classPrivateFieldSet(this, _SamsungTvRemote_webSocket, _webSocket, "f");
                    cleanup();
                    resolve();
                }
                else if (message.event === 'ms.channel.timeOut') {
                    // Samsung TVs emit `ms.channel.timeOut` when the handshake stalls (e.g. the
                    // on-TV authorization prompt wasn't confirmed in time, or the channel went idle).
                    // Throwing here surfaced as an uncaught error from inside the event handler. Instead,
                    // tear down the half-open socket and transparently retry the connection a bounded
                    // number of times, then resolve gracefully so callers never crash on a recoverable timeout.
                    const retries = (this._handshakeTimeoutRetries = (this._handshakeTimeoutRetries || 0) + 1);
                    cleanup();
                    _webSocket.close();
                    __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_disconnectFromTV).call(this);
                    if (retries > 3) {
                        this._handshakeTimeoutRetries = 0;
                        logger.warn('âš ï¸ Repeated ms.channel.timeOut during handshake â€” resolving gracefully without a live connection');
                        resolve();
                        return;
                    }
                    logger.warn(`âš ï¸ Received ms.channel.timeOut during handshake â€” reconnecting (attempt ${retries}/3)...`);
                    __classPrivateFieldGet(this, _SamsungTvRemote_instances, "m", _SamsungTvRemote_connectToTV).call(this).then(() => {
                        this._handshakeTimeoutRetries = 0;
                        resolve();
                    }, reject);
                }
                else {
                    throw new Error(`Unexpected handshake message: ${data.toString()}`);
                }
            });
        }), "f");
        try {
            yield __classPrivateFieldGet(this, _SamsungTvRemote_connectingPromise, "f");
        }
        finally {
            __classPrivateFieldSet(this, _SamsungTvRemote_connectingPromise, null, "f");
        }
    });
};

