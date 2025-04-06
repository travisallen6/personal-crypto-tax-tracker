import { Injectable, Logger } from '@nestjs/common';
import { CostBasisService } from './cost-basis.service';
import { DisposalEventService } from '../cost-basis-event/disposal-event.service';
import { AcquisitionEventService } from '../cost-basis-event/acquisition-event.service';
import { AcquisitionEvent } from '../cost-basis-event/acquisition-event';
import { CreateCostBasisDto } from './dto/create-cost-basis.dto';
import Decimal from 'decimal.js';
import { CostBasis } from './entities/cost-basis.entity';

@Injectable()
export class CostBasisSyncService {
  private readonly logger = new Logger(CostBasisSyncService.name);

  constructor(
    private readonly costBasisService: CostBasisService,
    private readonly disposalEventService: DisposalEventService,
    private readonly acquisitionEventService: AcquisitionEventService,
  ) {}

  private async throwErrorForTotalQuantityMismatch(userAddresses: string[]) {
    const [disposalEvents, acquisitionEvents] = await Promise.all([
      this.disposalEventService.getUnlinkedTotalQuantityByCurrency(
        userAddresses,
      ),
      this.acquisitionEventService.getUnlinkedTotalQuantityByCurrency(
        userAddresses,
      ),
    ]);

    const allCurrencies = new Set([
      ...Object.keys(disposalEvents),
      ...Object.keys(acquisitionEvents),
    ]);

    Array.from(allCurrencies).forEach((currency) => {
      const disposalTotal = disposalEvents[currency];
      const acquisitionTotal = acquisitionEvents[currency];

      if (!disposalTotal) {
        this.logger.error(
          `Disposal total for currency ${currency} is undefined`,
        );

        throw new Error(`Disposal total for currency ${currency} is undefined`);
      }

      if (!acquisitionTotal) {
        this.logger.error(
          `Acquisition total for currency ${currency} is undefined`,
        );

        throw new Error(
          `Acquisition total for currency ${currency} is undefined`,
        );
      }
      const totalDifference = disposalTotal.minus(acquisitionTotal).abs();

      if (totalDifference.gt(0)) {
        this.logger.error(
          `Total quantity mismatch for currency ${currency}: off by ${totalDifference.toString()}`,
        );

        throw new Error(
          `Total quantity mismatch for currency ${currency}: off by ${totalDifference.toString()}`,
        );
      }
    });
  }

  private groupAcquisitionEventsByCurrency(
    acquisitionEvents: AcquisitionEvent[],
  ) {
    return acquisitionEvents.reduce((acc, event) => {
      const currency = event.currency;
      if (!acc.has(currency)) {
        acc.set(currency, []);
      }
      acc.get(currency)!.push(event);
      return acc;
    }, new Map<string, AcquisitionEvent[]>());
  }

  async syncCostBasis(userAddresses: string[]) {
    await this.throwErrorForTotalQuantityMismatch(userAddresses);

    const [disposalEvents, acquisitionEvents] = await Promise.all([
      this.disposalEventService.getUnlinkedDisposalEvents(userAddresses),
      this.acquisitionEventService.getUnlinkedAcquisitionEvents(
        userAddresses,
        'DESC',
      ),
    ]);

    const acquisitionEventsByCurrency =
      this.groupAcquisitionEventsByCurrency(acquisitionEvents);

    const costBasisRecordsToCreate: CreateCostBasisDto[] = [];

    for (const disposalEvent of disposalEvents) {
      const currency = disposalEvent.currency;
      const acquisitionEvents = acquisitionEventsByCurrency.get(currency) ?? [];

      let currentAcquisitionEvent = acquisitionEvents.at(-1);

      while (disposalEvent.isExhausted === false) {
        if (!currentAcquisitionEvent) {
          this.logger.warn(
            `No acquisition events found for currency ${currency}`,
          );

          throw new Error(
            `No acquisition events found for currency ${currency}`,
          );
        }

        const {
          newCostBasisRecord,
          isAcquisitionEventExhausted,
          isDisposalEventExhausted,
        } = disposalEvent.linkWithCostAcquisitionEvent(currentAcquisitionEvent);

        if (isAcquisitionEventExhausted) {
          acquisitionEvents.pop();
          currentAcquisitionEvent = acquisitionEvents.at(-1);
        }

        costBasisRecordsToCreate.push(newCostBasisRecord);

        if (isDisposalEventExhausted) {
          break;
        }
      }
    }

    await this.costBasisService.createMany(costBasisRecordsToCreate);

    this.logger.log(
      `Created ${costBasisRecordsToCreate.length} cost basis records`,
    );
  }

  private buildSourceIdToQuantityMap(costBasisRecords: CostBasis[]) {
    return new Map<string, Decimal>(
      costBasisRecords.flatMap(({ disposalEvent, acquisitionEvent }) => {
        const sourceIdQuantitiesToInclude: [string, Decimal][] = [];

        if (disposalEvent) {
          sourceIdQuantitiesToInclude.push([
            disposalEvent.sourceId,
            disposalEvent.quantity,
          ]);
        }

        if (acquisitionEvent) {
          sourceIdQuantitiesToInclude.push([
            acquisitionEvent.sourceId,
            acquisitionEvent.quantity,
          ]);
        }

        return sourceIdQuantitiesToInclude;
      }),
    );
  }

  public async validateLinkedAcquisitionEvents(): Promise<string[]> {
    const errors: string[] = [];
    const costBasisRecords = await this.costBasisService.findAllLinked();
    const sourceIdToQuantity =
      this.buildSourceIdToQuantityMap(costBasisRecords);

    for (const {
      disposalEvent,
      acquisitionEvent,
      quantity: costBasisQuantity,
    } of costBasisRecords) {
      // is disposal event overspent
      if (disposalEvent) {
        const runningDisposalQuantity = sourceIdToQuantity.get(
          disposalEvent.sourceId,
        );

        if (runningDisposalQuantity) {
          sourceIdToQuantity.set(
            disposalEvent.sourceId,
            runningDisposalQuantity.minus(costBasisQuantity),
          );
        } else {
          errors.push(
            `Disposal event ${disposalEvent.id} has no running disposal quantity`,
          );
        }
      }
      // is acquisition event underspent
      if (acquisitionEvent) {
        const runningAcquisitionQuantity = sourceIdToQuantity.get(
          acquisitionEvent.sourceId,
        );

        if (runningAcquisitionQuantity) {
          sourceIdToQuantity.set(
            acquisitionEvent.sourceId,
            runningAcquisitionQuantity.minus(costBasisQuantity),
          );
        } else {
          errors.push(
            `Acquisition event ${acquisitionEvent.id} has no running acquisition quantity`,
          );
        }
      }

      // is disposal event and acquisition event different currencies?
      if (
        disposalEvent &&
        acquisitionEvent &&
        disposalEvent.currency !== acquisitionEvent.currency
      ) {
        errors.push(
          `Disposal event ${disposalEvent.id} and acquisition event ${acquisitionEvent.id} have different currencies: ${disposalEvent.currency}, ${acquisitionEvent.currency}`,
        );
      }
    }

    for (const [sourceId, quantity] of sourceIdToQuantity.entries()) {
      if (!quantity.equals(0)) {
        errors.push(
          `Cost basis source ID ${sourceId} has an unlinked quantity: ${quantity.toString()}`,
        );
      }
    }

    return errors;
  }
}
