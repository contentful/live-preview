import type { AssetProps, EntryProps } from 'contentful-management';

import * as gql from './graphql';
import { generateUID, StorageMap } from './helpers';
import * as rest from './rest';
import {
  Argument,
  ContentType,
  Entity,
  EntityWithSys,
  EntryReferenceMap,
  hasSysInformation,
  SubscribeCallback,
} from './types';

interface Subscription {
  data: Argument;
  locale: string;
  cb: SubscribeCallback;
}

interface MergeEntityProps {
  dataFromPreviewApp: Entity;
  locale: string;
  updateFromEntryEditor: EntryProps | AssetProps;
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

  private mergeEntity({
    contentType,
    dataFromPreviewApp,
    entityReferenceMap,
    locale,
    updateFromEntryEditor,
  }: Omit<MergeEntityProps, 'dataFromPreviewApp'> & { dataFromPreviewApp: EntityWithSys }): {
    data: Entity;
    updated: boolean;
  } {
    if ('__typename' in dataFromPreviewApp) {
      // GraphQL
      if (dataFromPreviewApp.__typename === 'Asset') {
        return {
          data: gql.updateAsset(dataFromPreviewApp, updateFromEntryEditor as AssetProps, locale),
          updated: true,
        };
      }

      return {
        data: gql.updateEntry(
          contentType,
          dataFromPreviewApp,
          updateFromEntryEditor as EntryProps,
          locale,
          entityReferenceMap
        ),
        updated: true,
      };
    }

    if (this.isEntryOrAsset(dataFromPreviewApp)) {
      // REST
      return {
        data: rest.updateEntry(
          contentType,
          dataFromPreviewApp as EntryProps,
          updateFromEntryEditor as EntryProps,
          locale
        ),
        updated: true,
      };
    }

    return { updated: false, data: dataFromPreviewApp };
  }

  /**
   * Merges the `dataFromPreviewApp` together with the `updateFromEntryEditor`
   * If there is not direct match, it will try to merge things together recursively
   * Caches the result if cache is enabled and the entity has a `sys.id`
   */
  private mergeNestedReference(
    { dataFromPreviewApp, ...params }: MergeEntityProps,
    useCache = true
  ): { data: Entity; updated: boolean } {
    const dataFromPreviewappId = hasSysInformation(dataFromPreviewApp) && dataFromPreviewApp.sys.id;
    const isCacheable = useCache && dataFromPreviewappId;

    // Flag to detect if something got updated and trigger only the subscription's if necessary
    // TODO: This is still not perfect as it doesn't check if anything got updated, only if something could have been merged.
    let updated = false;
    // If the entity is cacheable and it was once proceeded we use this one as base
    let result: Entity =
      (isCacheable ? this.storage.get(dataFromPreviewappId) : undefined) || dataFromPreviewApp;

    if (hasSysInformation(result) && dataFromPreviewappId === params.updateFromEntryEditor.sys.id) {
      // Happy path, direct match from received and provided data
      // Let's update it
      const merged = this.mergeEntity({ ...params, dataFromPreviewApp: result });
      result = merged.data;
      updated = merged.updated;
    } else {
      // No direct match, let's check if there is a nested reference and then update it
      for (const key in result) {
        const value = result[key];

        if (!value) {
          continue;
        }

        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (value[i] && typeof value[i] === 'object') {
              // TODO: pass true if the top level could not be cached
              const match = this.mergeNestedReference(
                { ...params, dataFromPreviewApp: value[i] },
                false
              );

              value[i] = match.data;
              updated = updated || match.updated;
            }
          }
        }

        if (typeof value === 'object') {
          // TODO: pass true if the top level could not be cached
          const match = this.mergeNestedReference(
            { ...params, dataFromPreviewApp: value as Entity },
            false
          );

          result[key] = match.data;
          updated = updated || match.updated;
        }
      }
    }

    if (isCacheable) {
      // Cache the updated data for future updates
      this.storage.set(dataFromPreviewappId, result);
    }

    return { data: result, updated };
  }

  private merge({ dataFromPreviewApp, ...params }: MergeArgumentProps): {
    updated: boolean;
    data: Argument;
  } {
    if (Array.isArray(dataFromPreviewApp)) {
      const data: Entity[] = [];
      let updated = false;

      for (const d of dataFromPreviewApp) {
        const result = this.mergeNestedReference({ ...params, dataFromPreviewApp: d });

        data.push(result.data);
        updated = updated || result.updated;
      }

      return { data, updated };
    }

    return this.mergeNestedReference({ ...params, dataFromPreviewApp });
  }

  private isEntryOrAsset(entity: unknown): entity is AssetProps | EntryProps {
    return hasSysInformation(entity) && 'fields' in entity;
  }

  /** Receives the data from the message event handler and calls the subscriptions */
  public receiveMessage({
    entity,
    contentType,
    entityReferenceMap,
  }: Record<string, unknown>): void {
    if (this.isEntryOrAsset(entity)) {
      this.subscriptions.forEach((s) => {
        const { updated, data } = this.merge({
          dataFromPreviewApp: s.data,
          locale: s.locale,
          updateFromEntryEditor: entity,
          contentType: contentType as ContentType,
          entityReferenceMap: entityReferenceMap as EntryReferenceMap,
        });

        // Only if there was an update, trigger the callback to unnecessary re-renders
        if (updated) {
          s.cb(data);
        }
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
