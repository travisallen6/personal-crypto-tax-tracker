import Decimal from 'decimal.js';
import { DisposalEvent } from './disposal-event';
import { AcquisitionEvent } from './acquisition-event';
import {
  testAcquisitionChainEvent,
  testAcquisitionExchangeEvent,
  testDisposalChainEvent,
} from './test/test-data';

describe('AcquisitionEvent', () => {
  it('can be created from a chain event', () => {
    const acquisitionEvent = new AcquisitionEvent(testAcquisitionChainEvent);

    expect(acquisitionEvent.id).toBe(testAcquisitionChainEvent.id);
    expect(acquisitionEvent.quantity).toBe(testAcquisitionChainEvent.quantity);
    expect(acquisitionEvent.currency).toBe(
      testAcquisitionChainEvent.tokenSymbol,
    );
    expect(acquisitionEvent.availableCostBasisQuantity).toBe(
      testAcquisitionChainEvent.quantity,
    );
  });

  it('can be created from an exchange event', () => {
    const acquisitionEvent = new AcquisitionEvent(testAcquisitionExchangeEvent);

    expect(acquisitionEvent.id).toBe(testAcquisitionExchangeEvent.id);
    expect(acquisitionEvent.quantity.toNumber()).toBe(
      testAcquisitionExchangeEvent.vol,
    );
    expect(acquisitionEvent.currency).toBe(
      testAcquisitionExchangeEvent.baseCurrency,
    );
    expect(acquisitionEvent.availableCostBasisQuantity.toNumber()).toBe(
      testAcquisitionExchangeEvent.vol,
    );
  });

  it('can link with a disposal event', () => {
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

  it('can exhaust the acquisition event', () => {
    const disposalQuantity = new Decimal(1_000);
    const disposalEvent = new DisposalEvent({
      ...testDisposalChainEvent,
      quantity: disposalQuantity,
    });
    const acquisitionEvent = new AcquisitionEvent({
      ...testAcquisitionChainEvent,
      quantity: disposalQuantity.minus(1),
    });
    const result = disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent);

    expect(acquisitionEvent.isExhausted).toBe(true);
    expect(result.isAcquisitionEventExhausted).toBe(
      acquisitionEvent.isExhausted,
    );
  });

  it('fails if the acquisition event is already exhausted', () => {
    const disposalEvent = new DisposalEvent(testDisposalChainEvent);
    const acquisitionEvent = new AcquisitionEvent({
      ...testAcquisitionChainEvent,
      quantity: new Decimal(0),
    });

    expect(() =>
      disposalEvent.linkWithCostAcquisitionEvent(acquisitionEvent),
    ).toThrow();
  });

  it('fails if the acquisition event available quantity would go below 0by the spent quantity', () => {
    const availableQuantity = new Decimal(100);
    const acquisitionEvent = new AcquisitionEvent({
      ...testAcquisitionExchangeEvent,
      vol: availableQuantity.toNumber(),
    });

    expect(() =>
      acquisitionEvent.spendAvailableCostBasisQuantity(
        availableQuantity.add(1),
      ),
    ).toThrow();
  });
});
