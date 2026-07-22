"use strict";
/**
 *  samsung-tv-remote
 *  Remote client for Samsung SmartTV starting from 2016
 *
 *  @author Badisi
 *  @license Released under the MIT license
 *
 *  https://github.com/Badisi/samsung-tv-remote
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamsungTvRemote = exports.Keys = exports.getLastConnectedDevice = exports.getAwakeSamsungDevices = void 0;
var discovery_1 = require("./discovery");
Object.defineProperty(exports, "getAwakeSamsungDevices", { enumerable: true, get: function () { return discovery_1.getAwakeSamsungDevices; } });
Object.defineProperty(exports, "getLastConnectedDevice", { enumerable: true, get: function () { return discovery_1.getLastConnectedDevice; } });
var keys_1 = require("./keys");
Object.defineProperty(exports, "Keys", { enumerable: true, get: function () { return keys_1.Keys; } });
var remote_1 = require("./remote");
Object.defineProperty(exports, "SamsungTvRemote", { enumerable: true, get: function () { return remote_1.SamsungTvRemote; } });
