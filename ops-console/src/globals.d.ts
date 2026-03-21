export { };

declare global {
    interface Window {
        _scout: {
            forceAgenticRefill: () => void;
            getMissionLog: () => any[];
        };
    }
}
