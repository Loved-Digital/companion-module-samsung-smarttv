export declare const createLogger: (prefix?: string, level?: "none" | "debug" | "info" | "warn" | "error") => {
    debug(...params: unknown[]): void;
    info(...params: unknown[]): void;
    warn(...params: unknown[]): void;
    error(...params: unknown[]): void;
};
