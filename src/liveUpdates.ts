import type { AssetProps, EntryProps } from 'contentful-management';

import { ContentfulSubscribeConfig } from '.';
import * as gql from './graphql';
import { clone, generateUID, sendMessageToEditor, StorageMap, debug } from './helpers';
import { validateDataForLiveUpdates } from './helpers/validation';
import * as rest from './rest';
import {
  Argument,
  ContentType,
  Entity,
  EntityWithSys,
  EntityReferenceMap,
  hasSysInformation,
  Subscription,
  MessageFromEditor,
  EntryUpdatedMessage,
} from './types';

interface MergeEntityProps {
  dataFromPreviewApp: Entity;
  locale: string;
  updateFromEntryEditor: EntryProps | AssetProps;
  contentType: ContentType;
  entityReferenceMap: EntityReferenceMap;
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
  private defaultLocale: string;

  constructor({ locale }: { locale: string }) {
    this.defaultLocale = locale;
    this.storage = new StorageMap<Entity>('live-updates', new Map());
    window.addEventListener('beforeunload', () => this.clearStorage());
  }

  private async mergeEntity({
    contentType,
    dataFromPreviewApp,
    entityReferenceMap,
    locale,
    updateFromEntryEditor,
  }: Omit<MergeEntityProps, 'dataFromPreviewApp'> & {
    dataFromPreviewApp: EntityWithSys;
  }): Promise<{
    data: Entity;
    updated: boolean;
  }> {
    if ('__typename' in dataFromPreviewApp) {
      // GraphQL
      if (dataFromPreviewApp.__typename === 'Asset') {
        return {
          data: gql.updateAsset(dataFromPreviewApp, updateFromEntryEditor as AssetProps, locale),
          updated: true,
        };
      }

      return {
        data: await gql.updateEntry({
          contentType,
          dataFromPreviewApp,
          updateFromEntryEditor: updateFromEntryEditor as EntryProps,
          locale,
          entityReferenceMap,
        }),
        updated: true,
      };
    }

    if (this.isCfEntity(dataFromPreviewApp)) {
      // REST
      return {
        data: await rest.updateEntity(
          contentType,
          dataFromPreviewApp as EntryProps,
          updateFromEntryEditor as EntryProps,
          locale,
          entityReferenceMap
        ),
        updated: true,
      };
    }

    return { updated: false, data: dataFromPreviewApp };
  }

  /**
   * Merges the `dataFromPreviewApp` together with the `updateFromEntryEditor`
   * If there is not direct match, it will try to merge things together recursively
   * caches the result if cache is enabled and the entity has a `sys.id`.
   * Caching should not be enabled for every entry,
   * because nested references could be merged differently together and this could solve to data loss.
   */
  private async mergeNestedReference(
    { dataFromPreviewApp, ...params }: MergeEntityProps,
    useCache: boolean
  ): Promise<{ data: Entity; updated: boolean }> {
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
      const merged = await this.mergeEntity({ ...params, dataFromPreviewApp: result });
      result = merged.data;
      updated = merged.updated;
    } else {
      // No direct match, let's check if there is a nested reference and then update it
      for (const key in result) {
        if (result[key] && typeof result[key] === 'object') {
          // TODO: set `useCache` to true if none of the parents could be cached
          const match = await this.merge(
            { ...params, dataFromPreviewApp: result[key] as Argument },
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

  private async merge(
    { dataFromPreviewApp, ...params }: MergeArgumentProps,
    useCache = true
  ): Promise<{
    updated: boolean;
    data: Argument;
  }> {
    if (Array.isArray(dataFromPreviewApp)) {
      const data: Entity[] = [];
      let updated = false;

      for (const d of dataFromPreviewApp) {
        const result = await this.mergeNestedReference(
          { ...params, dataFromPreviewApp: d },
          useCache
        );

        data.push(result.data);
        updated = updated || result.updated;
      }

      return { data, updated };
    }

    return this.mergeNestedReference({ ...params, dataFromPreviewApp }, useCache);
  }

  private isCfEntity(entity: unknown): entity is AssetProps | EntryProps {
    return hasSysInformation(entity) && 'fields' in entity;
  }

  /** Receives the data from the message event handler and calls the subscriptions */
  public async receiveMessage(message: MessageFromEditor): Promise<void> {
    if (message.action === 'ENTRY_UPDATED') {
      const { entity, contentType, entityReferenceMap } = message as EntryUpdatedMessage;

      await Promise.all(
        [...this.subscriptions].map(async ([, s]) => {
          try {
            const { updated, data } = await this.merge({
              // Clone the original data on the top level,
              // to prevent cloning multiple times (time)
              // or modifying the original data (failure potential)
              dataFromPreviewApp: clone(s.data),
              locale: s.locale || this.defaultLocale,
              updateFromEntryEditor: entity,
              contentType: contentType,
              entityReferenceMap: entityReferenceMap,
            });

            // Only if there was an update, trigger the callback to unnecessary re-renders
            if (updated) {
              s.callback(data);
            }
          } catch (error) {
            debug.error('Failed to apply live update', {
              error,
              subscribedData: s.data,
              updateFromEditor: entity,
            });
          }
        })
      );
    }
  }

  private restore(data: Argument, id: string): void {
    if (!data) return;

    const restoreLogic = (item: Entity) => {
      if (hasSysInformation(item)) {
        const restoredItem = this.storage.get(item.sys.id);
        if (restoredItem) {
          return restoredItem;
        }
      }
      return item;
    };

    if (Array.isArray(data)) {
      const restoredData: Entity[] = data.map(restoreLogic);
      //ensure callback is only called for active subscriptions
      const subscription = this.subscriptions.get(id);
      if (subscription) {
        subscription.callback(restoredData);
      }
    } else {
      const restored = restoreLogic(data);
      if (restored !== data) {
        //ensure callback is only called for active subscriptions
        const subscription = this.subscriptions.get(id);
        if (subscription) {
          subscription.callback(restored);
        }
      }
    }
  }

  private clearStorage(): void {
    this.storage.clear();
  }

  /**
   * Subscribe to data changes from the Editor, returns a function to unsubscribe
   * Will be called once initially for the restored data
   */
  public subscribe({ data, locale, callback }: ContentfulSubscribeConfig): VoidFunction {
    const { isGQL, isValid } = validateDataForLiveUpdates(data);

    if (!isValid) {
      return () => {
        /* noop */
      };
    }

    const id = generateUID();
    this.subscriptions.set(id, { data, locale, callback });
    /*  Restore function is being called immediately after the subscription is added,
        which might cause the callback to be called even if the subscription is removed immediately afterward.
        To fix this, we wrap the restore call in a setTimeout,
        allowing the unsubscribe function to be executed before the callback is called.
    */
    setTimeout(() => {
      this.restore(data, id);
    }, 0);

    // Tell the editor that there is a subscription
    // It's possible that the `type` is not 100% accurate as we don't know how it will be merged in the future.
    sendMessageToEditor({
      action: 'SUBSCRIBED',
      type: isGQL ? 'GQL' : 'REST',
    });

    return () => {
      this.subscriptions.delete(id);
    };
  }
}
