/**
 * Pet State Machine
 * Manages pet behavior states and prevents race conditions
 * Fixes: Button spam by enforcing single active state
 */

import { EventEmitter } from '../core/EventEmitter';
import { PetState, EVENTS } from '../utils/Constants';

type StateTransition = {
  from: PetState[];
  to: PetState;
};

export class PetStateMachine {
  private currentState: PetState;
  private events: EventEmitter;
  private stateStartTime: number;

  // Valid state transitions
  private readonly transitions: Map<PetState, PetState[]> = new Map([
    [PetState.IDLE, [PetState.EATING, PetState.PLAYING, PetState.SLEEPING, PetState.SICK, PetState.EVOLVING, PetState.DEAD]],
    [PetState.EATING, [PetState.IDLE, PetState.SICK, PetState.DEAD]],
    [PetState.PLAYING, [PetState.IDLE, PetState.SICK, PetState.DEAD]],
    [PetState.SLEEPING, [PetState.IDLE, PetState.SICK, PetState.DEAD]],
    [PetState.SICK, [PetState.IDLE, PetState.DEAD]],
    [PetState.EVOLVING, [PetState.IDLE, PetState.DEAD]],
    [PetState.DEAD, []],  // Terminal state
  ]);

  constructor(events: EventEmitter, initialState: PetState = PetState.IDLE) {
    this.events = events;
    this.currentState = initialState;
    this.stateStartTime = Date.now();
  }

  /**
   * Get current state
   */
  getState(): PetState {
    return this.currentState;
  }

  /**
   * Get time in current state (ms)
   */
  getStateTime(): number {
    return Date.now() - this.stateStartTime;
  }

  /**
   * Check if transition is valid
   */
  canTransition(to: PetState): boolean {
    const allowedTransitions = this.transitions.get(this.currentState);
    return allowedTransitions?.includes(to) ?? false;
  }

  /**
   * Attempt state transition
   * Returns true if successful, false if invalid
   */
  transition(to: PetState): boolean {
    if (!this.canTransition(to)) {
      console.warn(`Invalid transition: ${this.currentState} → ${to}`);
      return false;
    }

    const from = this.currentState;
    this.currentState = to;
    this.stateStartTime = Date.now();

    this.events.emit(EVENTS.PET_STATE_CHANGED, { from, to });
    return true;
  }

  /**
   * Check if pet is currently interacting (busy)
   */
  isInteracting(): boolean {
    return (
      this.currentState === PetState.EATING ||
      this.currentState === PetState.PLAYING ||
      this.currentState === PetState.EVOLVING
    );
  }

  /**
   * Check if pet can receive interactions
   */
  canInteract(): boolean {
    return this.currentState === PetState.IDLE && !this.isInteracting();
  }

  /**
   * Force state (use sparingly, bypasses validation)
   */
  forceState(state: PetState): void {
    const from = this.currentState;
    this.currentState = state;
    this.stateStartTime = Date.now();
    this.events.emit(EVENTS.PET_STATE_CHANGED, { from, to: state });
  }

  /**
   * Reset to IDLE state
   */
  reset(): void {
    this.transition(PetState.IDLE);
  }
}
