import { describe, it, expect } from '@jest/globals';
import { DeliveryStateMachine } from '../domain/services/DeliveryStateMachine';
import { InvalidDeliveryStateTransitionError } from '../domain/errors/InvalidDeliveryStateTransitionError';

describe('DeliveryStateMachine', () => {
  it('should not throw on valid transitions', () => {
    expect(() =>
      DeliveryStateMachine.validateTransition('PENDING', 'ASSIGNED')
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition('ASSIGNED', 'IN_TRANSIT')
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition('IN_TRANSIT', 'DELIVERED')
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition('IN_TRANSIT', 'FAILED')
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition('FAILED', 'RETURNED')
    ).not.toThrow();
  });

  it('should allow the failed-delivery decision flow transitions', () => {
    expect(() =>
      DeliveryStateMachine.validateTransition(
        'FAILED',
        'AWAITING_CLIENT_DECISION'
      )
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition(
        'AWAITING_CLIENT_DECISION',
        'RETURNED'
      )
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition(
        'AWAITING_CLIENT_DECISION',
        'PENDING'
      )
    ).not.toThrow();
  });

  it('should reject invalid transitions from AWAITING_CLIENT_DECISION', () => {
    expect(() =>
      DeliveryStateMachine.validateTransition(
        'AWAITING_CLIENT_DECISION',
        'DELIVERED'
      )
    ).toThrow(InvalidDeliveryStateTransitionError);
    expect(() =>
      DeliveryStateMachine.validateTransition(
        'AWAITING_CLIENT_DECISION',
        'IN_TRANSIT'
      )
    ).toThrow(InvalidDeliveryStateTransitionError);
  });

  it('should not throw if status is the same', () => {
    expect(() =>
      DeliveryStateMachine.validateTransition('ASSIGNED', 'ASSIGNED')
    ).not.toThrow();
    expect(() =>
      DeliveryStateMachine.validateTransition('IN_TRANSIT', 'IN_TRANSIT')
    ).not.toThrow();
  });

  it('should throw InvalidDeliveryStateTransitionError on invalid transitions', () => {
    expect(() =>
      DeliveryStateMachine.validateTransition('PENDING', 'IN_TRANSIT')
    ).toThrow(InvalidDeliveryStateTransitionError);

    expect(() =>
      DeliveryStateMachine.validateTransition('ASSIGNED', 'DELIVERED')
    ).toThrow(InvalidDeliveryStateTransitionError);

    expect(() =>
      DeliveryStateMachine.validateTransition('DELIVERED', 'RETURNED')
    ).toThrow(InvalidDeliveryStateTransitionError);

    expect(() =>
      DeliveryStateMachine.validateTransition('RETURNED', 'ASSIGNED')
    ).toThrow(InvalidDeliveryStateTransitionError);
  });
});
