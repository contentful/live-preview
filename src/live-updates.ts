import * as gql from './graphql';
import { generateUID, StorageMap } from './helpers';
import { hasNestedReference } from './helpers/nestedReferences';
import * as rest from './rest';
import {
  Argument,
  ContentType,
  Entity,
  EntryReferenceMap,
  SubscribeCallback,
  SysProps,
} from './types';

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
      return gql.updateAsset(dataFromPreviewApp as any, updateFromEntryEditor as any, locale);
    }

    const updatedData = gql.updateEntry(
      contentType,
      dataFromPreviewApp as any,
      updateFromEntryEditor as any,
      locale,
      entityReferenceMap
    );

    return updatedData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mergeRest({
    dataFromPreviewApp,
    updateFromEntryEditor,
    locale,
    contentType,
  }: MergeEntityProps): Entity {
    const updatedData = rest.updateEntry(
      contentType,
      dataFromPreviewApp as any,
      updateFromEntryEditor as any,
      locale
    );

    return updatedData;
  }

  // TODO: only call the `cb` if there was an update
  private mergeNestedReference(
    dataFromPreviewApp: Entity,
    updateFromEntryEditor: Entity,
    mergeFn: (original: Entity, incomming: Entity) => Entity,
    useCache = true
  ): { data: Entity; updated: boolean } {
    if (!('sys' in updateFromEntryEditor)) {
      return { data: dataFromPreviewApp, updated: false };
    }

    const updateFromEntryEditorId = (updateFromEntryEditor.sys as SysProps).id;
    const dataFromPreviewappId =
      'sys' in dataFromPreviewApp && (dataFromPreviewApp.sys as SysProps).id;

    const isCacheable = useCache && dataFromPreviewappId;
    let updated = false;
    let result: Entity =
      (isCacheable ? this.storage.get(dataFromPreviewappId) : undefined) || dataFromPreviewApp;

    if (dataFromPreviewappId === updateFromEntryEditorId) {
      result = mergeFn(result, updateFromEntryEditor);
      updated = true;
    } else if (hasNestedReference(result, updateFromEntryEditorId)) {
      for (const k in result) {
        const value = result[k];

        if (!value) {
          continue;
        }

        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const arrayValue = value[i];
            if (
              !arrayValue ||
              typeof arrayValue !== 'object' ||
              !hasNestedReference(arrayValue, updateFromEntryEditorId)
            ) {
              continue;
            }

            // TODO: pass true if the top level could not be cached
            const match = this.mergeNestedReference(
              arrayValue,
              updateFromEntryEditor,
              mergeFn,
              false
            );

            if (match.updated) {
              value[i] = match.data;
              updated = true;
            }
          }
        }

        if (
          typeof value === 'object' &&
          hasNestedReference(value as Entity, updateFromEntryEditorId)
        ) {
          // TODO: pass true if the top level could not be cached
          const match = this.mergeNestedReference(
            value as Entity,
            updateFromEntryEditor,
            mergeFn,
            false
          );
          if (match.updated) {
            result[k] = match.data;
            updated = true;
          }
        }
      }
    }

    if (isCacheable) {
      // Cache the updated data for future updates
      this.storage.set(dataFromPreviewappId, result);
    }

    return { data: result, updated };
  }

  // TODO: handle updated from mergeNestedReference
  private merge({
    dataFromPreviewApp,
    updateFromEntryEditor,
    ...data
  }: MergeArgumentProps): Argument {
    const mergeFn = (dataFromPreviewApp: Entity, updateFromEntryEditor: Entity) =>
      '__typename' in dataFromPreviewApp
        ? this.mergeGraphQL({ ...data, dataFromPreviewApp, updateFromEntryEditor })
        : this.mergeRest({ ...data, dataFromPreviewApp, updateFromEntryEditor });

    if (Array.isArray(dataFromPreviewApp)) {
      return dataFromPreviewApp.map(
        (i) => this.mergeNestedReference(i, { ...updateFromEntryEditor }, mergeFn).data
      );
    }

    const result = this.mergeNestedReference(
      dataFromPreviewApp,
      { ...updateFromEntryEditor },
      mergeFn
    );

    return result.data;
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
