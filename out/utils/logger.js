"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// src/utils/logger.ts
const winston_1 = __importDefault(require("winston"));
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)),
    transports: [
        new winston_1.default.transports.File({ filename: 'extension.log' }),
        new winston_1.default.transports.Console()
    ]
});
//# sourceMappingURL=logger.js.map