import * as gql from './graphql';
import { Argument, Entity, SubscribeCallback } from './types';
import { generateUID } from './utils';

interface Subscription {
  data: Argument;
  locale: string;
  cb: SubscribeCallback;
}

/**
 * LiveUpdates for the Contentful Live Preview mode
 * receives the updated Entity from the Editor and merges them together with the provided data
 */
export class LiveUpdates {
  private subscriptions = new Map<string, Subscription>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeGraphQL(
    initial: Argument,
    locale: string,
    updated: Entity,
    contentType: any
  ): Argument {
    if ((initial as any).__typename === 'Asset') {
      return gql.updateAsset(initial as any, updated as any, locale);
    }

    //@ts-expect-error -- ..
    return gql.updateEntry(contentType, initial, updated, locale);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeRest(initial: Argument, locale: string, updated: Entity): Argument {
    // TODO: https://contentful.atlassian.net/browse/TOL-1033
    // TODO: https://contentful.atlassian.net/browse/TOL-1025
    return initial;
  }

  private merge(initial: Argument, locale: string, updated: Entity, contentType: any): Argument {
    if ('__typename' in initial) {
      return this.mergeGraphQL(initial, locale, updated, contentType);
    }
    return this.mergeRest(initial, locale, updated);
  }

  /** Receives the data from the message event handler and calls the subscriptions */
  public receiveMessage({ entity, contentType }: Record<string, unknown>): void {
    if (entity && typeof entity === 'object') {
      this.subscriptions.forEach((s) =>
        s.cb(this.merge(s.data, s.locale, entity as Entity, contentType))
      );
    }
  }

  /** Subscribe to data changes from the Editor, returns a function to unsubscribe */
  public subscribe(data: Argument, locale: string, cb: SubscribeCallback): VoidFunction {
    const id = generateUID();
    this.subscriptions.set(id, { data, locale, cb });

    return () => {
      this.subscriptions.delete(id);
    };
  }
}
