/**
 * EventEmitter
 * Simple publish-subscribe pattern for decoupled communication
 * Fixes: Memory leaks by providing proper cleanup methods
 */

type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once(event: string, handler: EventHandler): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) return;

    const handlers = this.events.get(event)!;
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }

    // Clean up empty event arrays
    if (handlers.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    const handlers = this.events.get(event)!;
    handlers.forEach((handler) => handler(...args));
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Destroy the event emitter and clean up all listeners
   * CRITICAL: Prevents memory leaks
   */
  destroy(): void {
    this.events.clear();
  }
}

// Global event bus instance
export const globalEvents = new EventEmitter();
