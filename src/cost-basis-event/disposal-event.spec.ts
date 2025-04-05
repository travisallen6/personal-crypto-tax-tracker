import Decimal from 'decimal.js';
import { DisposalEvent } from './disposal-event';
import { AcquisitionEvent } from './acquisition-event';
import {
  testDisposalChainEvent,
  testDisposalExchangeEvent,
  testAcquisitionChainEvent,
  testAcquisitionExchangeEvent,
} from './test/test-data';

describe('DisposalEvent', () => {
  it('can be created from a chain event', () => {
    const disposalEvent = new DisposalEvent(testDisposalChainEvent);

    expect(disposalEvent.id).toBe(testDisposalChainEvent.id);
    expect(disposalEvent.quantity).toBe(testDisposalChainEvent.quantity);
    expect(disposalEvent.currency).toBe(testDisposalChainEvent.tokenSymbol);
    expect(disposalEvent.unaccountedCostBasisQuantity).toBe(
      testDisposalChainEvent.quantity,
    );
  });

  it('can be created from an exchange event', () => {
    const disposalEvent = new DisposalEvent(testDisposalExchangeEvent);

    expect(disposalEvent.id).toBe(testDisposalExchangeEvent.id);
    expect(disposalEvent.quantity.toNumber()).toBe(
      testDisposalExchangeEvent.vol,
    );
    expect(disposalEvent.currency).toBe(testDisposalExchangeEvent.baseCurrency);
    expect(disposalEvent.unaccountedCostBasisQuantity.toNumber()).toBe(
      testDisposalExchangeEvent.vol,
    );
  });

  it('can link with an acquisition event', () => {
    const disposalEvent = new DisposalEvent(testDisposalChainEvent);
    const acquisitionEvent = new AcquisitionEvent(testAcquisitionChainEvent);

    const { unaccountedCostBasisQuantity } = disposalEvent;
    const { availableCostBasisQuantity } = acquisitionEvent;

    const {
      newCostBasisRecord: { quantity: quantitySpent },
      isAcquisitionEventExhausted,
      isDisposalEventExhausted,
    } = disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent);

    expect(disposalEvent.unaccountedCostBasisQuantity.toNumber()).toBe(
      unaccountedCostBasisQuantity.minus(quantitySpent).toNumber(),
    );
    expect(acquisitionEvent.availableCostBasisQuantity.toNumber()).toBe(
      availableCostBasisQuantity.minus(quantitySpent).toNumber(),
    );
    expect(isAcquisitionEventExhausted).toBe(false);
    expect(isDisposalEventExhausted).toBe(true);
  });

  it('can exhaust the disposal event', () => {
    const acquisitionQuantity = new Decimal(1_000);
    const disposalEvent = new DisposalEvent({
      ...testDisposalChainEvent,
      quantity: acquisitionQuantity,
    });
    const acquisitionEvent = new AcquisitionEvent({
      ...testAcquisitionChainEvent,
      quantity: acquisitionQuantity,
    });
    const result = disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent);

    expect(disposalEvent.isExhausted).toBe(true);
    expect(result.isDisposalEventExhausted).toBe(disposalEvent.isExhausted);
  });

  it('fails if the acquisition event is not of the same currency', () => {
    const disposalEvent = new DisposalEvent(testDisposalChainEvent);
    const acquisitionEvent = new AcquisitionEvent(testAcquisitionExchangeEvent);

    disposalEvent.currency = 'ETH';
    acquisitionEvent.currency = 'BTC';

    expect(() =>
      disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent),
    ).toThrow();
  });

  it('fails if the disposal event is exhausted', () => {
    const disposalEvent = new DisposalEvent({
      ...testDisposalChainEvent,
      quantity: new Decimal(0),
    });
    const acquisitionEvent = new AcquisitionEvent(testAcquisitionChainEvent);

    expect(() =>
      disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent),
    ).toThrow();
  });

  it('fails if the acquisition event timestamp is after the disposal event timestamp', () => {
    // Create a disposal event with a specific timestamp
    const disposalEvent = new DisposalEvent({
      ...testDisposalChainEvent,
    });
    disposalEvent.timestamp = new Date('2023-01-01');

    // Create an acquisition event with a later timestamp
    const acquisitionEvent = new AcquisitionEvent({
      ...testAcquisitionChainEvent,
    });
    acquisitionEvent.timestamp = new Date('2023-01-02'); // One day later

    // Expect the linkWithCostAcquisitionEvent call to throw an error

    expect(() =>
      disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent),
    ).toThrow();
  });
});
