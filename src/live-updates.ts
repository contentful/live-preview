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
  dataFromPreviewApp: Entity;
  locale: string;
  updateFromEntryEditor: Entity;
  contentType: ContentType;
  entityReferenceMap: EntryReferenceMap;
}

interface MergeArgumentProps extends Omit<MergeEntityProps, 'dataFromPreviewApp'> {
  dataFromPreviewApp: Argument;
}

/**
 * LiveUpdates for the Contentful Live Preview mode
 * receives the updated Entity from the Editor and merges them together with the incoming data
 */
export class LiveUpdates {
  private subscriptions = new Map<string, Subscription>();
  private storage: StorageMap<Entity>;

  constructor() {
    this.storage = new StorageMap<Entity>('live-updates', new Map());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeGraphQL({
    dataFromPreviewApp,
    updateFromEntryEditor,
    locale,
    entityReferenceMap,
    contentType,
  }: MergeEntityProps): Entity {
    if ((dataFromPreviewApp as any).__typename === 'Asset') {
      return gql.updateAsset(
        dataFromPreviewApp as any,
        updateFromEntryEditor as any,
        locale,
        entityReferenceMap
      );
    }

    const entryId = (dataFromPreviewApp as any).sys.id;
    const cachedData = this.storage.get(entryId) || dataFromPreviewApp;

    const updatedData = gql.updateEntry(
      contentType,
      //@ts-expect-error -- ..
      cachedData,
      updateFromEntryEditor,
      locale,
      entityReferenceMap
    );

    // Cache the updated data for future updates
    this.storage.set(entryId, updatedData);

    return updatedData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeRest({
    dataFromPreviewApp,
    updateFromEntryEditor,
    locale,
    contentType,
  }: MergeEntityProps): Entity {
    const entryId = (dataFromPreviewApp as any).sys.id;
    const cachedData = this.storage.get(entryId) || dataFromPreviewApp;

    const updatedData = rest.updateEntry(
      contentType,
      //@ts-expect-error -- ..
      cachedData,
      updateFromEntryEditor as any,
      locale
    );

    // Cache the updated data for future updates
    this.storage.set(entryId, updatedData);

    return updatedData;
  }

  // TODO: we currently expect the provided data to have the sys.id directly, but it could be also nested
  // { items: [{ sys: { id }, ... }] }
  // do we support this case or should it be provided like that: [{ sys: { id } }]
  private mergeEntity(data: MergeEntityProps): Entity {
    if ('__typename' in data.dataFromPreviewApp) {
      return this.mergeGraphQL(data);
    }
    return this.mergeRest(data);
  }

  private merge({ dataFromPreviewApp, ...data }: MergeArgumentProps): Argument {
    if (Array.isArray(dataFromPreviewApp)) {
      return dataFromPreviewApp.map((d) => this.mergeEntity({ ...data, dataFromPreviewApp: d }));
    }

    return this.mergeEntity({ ...data, dataFromPreviewApp });
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
            dataFromPreviewApp: s.data,
            locale: s.locale,
            updateFromEntryEditor: entity as Entity,
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
