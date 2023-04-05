import * as gql from './graphql';
import * as rest from './rest';
import { Argument, ContentType, Entity, EntryReferenceMap, SubscribeCallback } from './types';
import { generateUID, StorageMap } from './utils';

interface Subscription {
  data: Argument;
  locale: string;
  cb: SubscribeCallback;
}

interface MergeEntityProps {
  initial: Entity;
  locale: string;
  incoming: Entity;
  contentType: ContentType;
  entityReferenceMap: EntryReferenceMap;
}

interface MergeArgumentProps extends Omit<MergeEntityProps, 'initial'> {
  initial: Argument;
}

/**
 * LiveUpdates for the Contentful Live Preview mode
 * receives the updated Entity from the Editor and merges them together with the provided data
 */
export class LiveUpdates {
  private subscriptions = new Map<string, Subscription>();
  private storage: StorageMap<Entity>;

  constructor() {
    this.storage = new StorageMap<Entity>('live-updates', new Map());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeGraphQL({
    initial,
    incoming,
    locale,
    entityReferenceMap,
    contentType,
  }: MergeEntityProps): Entity {
    if ((initial as any).__typename === 'Asset') {
      return gql.updateAsset(initial as any, incoming as any, locale, entityReferenceMap);
    }

    const entryId = (initial as any).sys.id;
    const cachedData = this.storage.get(entryId) || initial;

    const updatedData = gql.updateEntry(
      contentType,
      //@ts-expect-error -- ..
      cachedData,
      incoming,
      locale,
      entityReferenceMap
    );

    // Cache the updated data for future updates
    this.storage.set(entryId, updatedData);

    return updatedData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeRest({
    initial,
    incoming,
    locale,
    contentType,
  }: MergeEntityProps): Entity | Entity[] {
    // TODO: https://contentful.atlassian.net/browse/TOL-1033
    // TODO: https://contentful.atlassian.net/browse/TOL-1025

    const updatedData = rest.updateEntry(contentType, initial, incoming, locale);

    return updatedData;
  }

  // TODO: we currently expect the provided data to have the sys.id directly, but it could be also nested
  // { items: [{ sys: { id }, ... }] }
  // do we support this case or should it be provided like that: [{ sys: { id } }]
  private mergeEntity(data: MergeEntityProps): Entity {
    if ('__typename' in data.initial) {
      return this.mergeGraphQL(data);
    }
    return this.mergeRest(data);
  }

  private merge({ initial, ...data }: MergeArgumentProps): Argument {
    if (Array.isArray(initial)) {
      return initial.map((i) => this.mergeEntity({ ...data, initial: i }));
    }

    return this.mergeEntity({ ...data, initial });
  }

  /** Receives the data from the message event handler and calls the subscriptions */
  public receiveMessage({
    entity,
    contentType,
    entityReferenceMap,
  }: Record<string, unknown>): void {
    if (entity && typeof entity === 'object') {
      this.subscriptions.forEach((s) => {
        // TODO: only call merge and the cb if the incoming data is relevant and something did update
        s.cb(
          this.merge({
            initial: s.data,
            locale: s.locale,
            incoming: entity as Entity,
            contentType: contentType as ContentType,
            entityReferenceMap: entityReferenceMap as EntryReferenceMap,
          })
        );
      });
    }
  }

  // TODO: https://contentful.atlassian.net/browse/TOL-1080
  private restore(data: Argument, cb: SubscribeCallback): void {
    if (!data) return;

    if (Array.isArray(data)) {
      // TODO: implement for lists
      return;
    }

    const restored = this.storage.get((data as any).sys.id);
    if (restored) {
      cb(restored);
    }
  }

  /**
   * Subscribe to data changes from the Editor, returns a function to unsubscribe
   * Will be called once initially for the restored data
   */
  public subscribe(data: Argument, locale: string, cb: SubscribeCallback): VoidFunction {
    const id = generateUID();
    this.subscriptions.set(id, { data, locale, cb });
    // TODO: https://contentful.atlassian.net/browse/TOL-1080
    // this.restore(data, cb);

    return () => {
      this.subscriptions.delete(id);
    };
  }
}
