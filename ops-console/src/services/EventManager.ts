type EventCallback = (data?: any) => void;

class EventManager {
    private listeners: { [event: string]: EventCallback[] } = {};

    /**
     * Subscribe to an event
     */
    on(event: string, callback: EventCallback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // Return unsubscribe function
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Dispatch an event
     */
    emit(event: string, data?: any) {
        console.log(`[EVENT] Dispatched: ${event}`, data);
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

export const eventManager = new EventManager();
