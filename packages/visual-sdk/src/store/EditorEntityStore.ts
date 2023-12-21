import type { Asset, Entry } from 'contentful';

import { EntityStore } from './EntityStore';

export type RequestEntitiesMessage = {
  entityIds: string[];
  entityType: 'Asset' | 'Entry';
  locale: string;
};

export type RequestedEntitiesMessage = {
  entities: Array<Entry | Asset>;
};

export enum PostMessageMethods {
  REQUEST_ENTITIES = 'REQUEST_ENTITIES',
  REQUESTED_ENTITIES = 'REQUESTED_ENTITIES',
}

type SendMessage = (
  method: PostMessageMethods.REQUEST_ENTITIES,
  params: RequestEntitiesMessage
) => void;
type Subscribe = (
  method: PostMessageMethods.REQUESTED_ENTITIES,
  cb: (message: RequestedEntitiesMessage) => void
) => VoidFunction;

/**
 * EntityStore which resolves entries and assets from the editor
 * over the sendMessage and subscribe functions.
 */
export class EditorEntityStore extends EntityStore {
  private requestCache = new Map<string, Promise<any>>();
  private sendMessage: SendMessage;
  private subscribe: Subscribe;
  private timeoutDuration: number;

  constructor({
    entities,
    locale,
    sendMessage,
    subscribe,
    timeoutDuration = 3000,
  }: {
    entities: Array<Entry | Asset>;
    locale: string;
    sendMessage: SendMessage;
    subscribe: Subscribe;
    timeoutDuration?: number;
  }) {
    super({ entities, locale });
    this.sendMessage = sendMessage;
    this.subscribe = subscribe;
    this.timeoutDuration = timeoutDuration;
  }

  private cleanupPromise(referenceId: string) {
    setTimeout(() => {
      this.requestCache.delete(referenceId);
    }, 300);
  }

  private cacheIdSeperator = ',';

  private getCacheId(id: string[]): string {
    return id.length === 1 ? id[0] : id.join(this.cacheIdSeperator);
  }

  private async fetchEntity(type: 'Asset', ids: string[]): Promise<Array<Asset>>;
  private async fetchEntity(type: 'Entry', ids: string[]): Promise<Array<Entry>>;
  private async fetchEntity(
    type: 'Asset' | 'Entry',
    ids: string[]
  ): Promise<Array<Entry> | Array<Asset>> {
    const { missing, resolved } = this.getEntitiesFromMap(type, ids);

    if (missing.length === 0) {
      // everything is already in cache
      return resolved as Array<Entry> | Array<Asset>;
    }

    const cacheId = this.getCacheId(missing);
    const openRequest = this.requestCache.get(cacheId);

    if (openRequest) {
      return openRequest;
    }

    const newPromise = new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(
        PostMessageMethods.REQUESTED_ENTITIES,
        (message: RequestedEntitiesMessage) => {
          if (missing.every((id) => message.entities.find((entity) => entity.sys.id === id))) {
            clearTimeout(timeout);
            resolve(message.entities);

            this.cleanupPromise(cacheId);
            ids.forEach((id) => this.cleanupPromise(id));

            unsubscribe();
          }
        }
      );

      const timeout = setTimeout(() => {
        reject(new Error(`Request for entities timed out ${this.timeoutDuration}ms} for ${cacheId}`));

        this.cleanupPromise(cacheId);
        ids.forEach((id) => this.cleanupPromise(id));

        unsubscribe();
      }, this.timeoutDuration);

      this.sendMessage(PostMessageMethods.REQUEST_ENTITIES, {
        entityIds: missing,
        entityType: type,
        locale: this.locale,
      });
    });

    this.requestCache.set(cacheId, newPromise);
    ids.forEach((cid) => {
      this.requestCache.set(cid, newPromise);
    });

    const result = (await newPromise) as Array<Entry> | Array<Asset>;

    result.forEach((value) => {
      this.addEntity(value);
    });

    return this.getEntitiesFromMap(type, ids).resolved as Array<Entry> | Array<Asset>;
  }

  public async fetchAsset(id: string): Promise<Asset | undefined> {
    try {
      return (await this.fetchAssets([id]))[0];
    } catch (err) {
      // TODO: move to debug utils once it is extracted
      console.warn(`Failed to request asset ${id}`);
      return undefined;
    }
  }

  public fetchAssets(ids: string[]): Promise<Asset[]> {
    return this.fetchEntity('Asset', ids);
  }

  public async fetchEntry(id: string): Promise<Entry | undefined> {
    try {
      return (await this.fetchEntries([id]))[0];
    } catch (err) {
      // TODO: move to debug utils once it is extracted
      console.warn(`Failed to request entry ${id}`, err);
      return undefined;
    }
  }

  public fetchEntries(ids: string[]): Promise<Entry[]> {
    return this.fetchEntity('Entry', ids);
  }
}
