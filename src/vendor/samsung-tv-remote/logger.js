"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const createLogger = (prefix = 'SamsungTvRemote', level = 'none') => {
    var _a, _b;
    const _level = level !== 'none' ? level : ((_b = (_a = process.env.LOG_LEVEL) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : 'none');
    const _prefix = process.stdout.isTTY ? `\x1b[35m[${prefix}]\x1b[39m:` : `[${prefix}]:`;
    return {
        debug(...params) {
            if (['debug'].includes(_level)) {
                console.log(_prefix, ...params);
            }
        },
        info(...params) {
            if (['debug', 'info'].includes(_level)) {
                console.log(_prefix, ...params);
            }
        },
        warn(...params) {
            if (['debug', 'info', 'warn'].includes(_level)) {
                if (process.stdout.isTTY) {
                    console.error(`${_prefix}\x1b[33m`, ...params, '\x1b[39m');
                }
                else {
                    console.error(_prefix, ...params);
                }
            }
        },
        error(...params) {
            if (['debug', 'info', 'warn', 'error'].includes(_level)) {
                if (process.stdout.isTTY) {
                    console.error(`${_prefix}\x1b[31m`, ...params, '\x1b[39m');
                }
                else {
                    console.error(_prefix, ...params);
                }
            }
        }
    };
};
exports.createLogger = createLogger;
