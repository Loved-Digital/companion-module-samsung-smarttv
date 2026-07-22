"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAppToCache = exports.getAppFromCache = exports.saveDeviceToCache = exports.getDeviceFromCache = void 0;
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const getDeviceFromCache = () => {
    return getCache().lastConnectedDevice;
};
exports.getDeviceFromCache = getDeviceFromCache;
const saveDeviceToCache = (ip, mac, friendlyName) => {
};
exports.saveDeviceToCache = saveDeviceToCache;
const getAppFromCache = (appName) => {
    var _a;
    return (_a = getCache().appTokens) === null || _a === void 0 ? void 0 : _a[appName];
};
exports.getAppFromCache = getAppFromCache;
const saveAppToCache = (ip, port, appName, appToken) => {
};
exports.saveAppToCache = saveAppToCache;
// --- HELPER(s) ---
const getCacheFilePath = (name = 'badisi-samsung-tv-remote.json') => {
    var _a, _b;
    const homeDir = (0, node_os_1.homedir)();
    switch (process.platform) {
        case 'darwin':
            return (0, node_path_1.join)(homeDir, 'Library', 'Caches', name);
        case 'win32':
            return (0, node_path_1.join)(__dirname, name);
        default:
            return (0, node_path_1.join)((_b = process.env.XDG_CACHE_HOME) !== null && _b !== void 0 ? _b : (0, node_path_1.join)(homeDir, '.cache'), name);
    }
};
const getCache = () => {
    try {
        const filePath = getCacheFilePath();
        if ((0, node_fs_1.existsSync)(filePath)) {
            return JSON.parse((0, node_fs_1.readFileSync)(filePath).toString());
        }
        return {};
    }
    catch (_a) {
        return {};
    }
};
