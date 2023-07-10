import type { Asset, Entry } from 'contentful';
import { EntityStore } from './EntityStore';

type SendMessage = (params: EditorEntityStoreMessage) => void;

export type EditorEntityStoreMessage = {
  action: 'REQUEST_ENTITIES';
  entityIds: string[],
  entityType: 'Asset' | 'Entry',
  locale: string,
}

export type EditorEntityStoreReceivedMessage = {
  action: 'REQUESTED_ENTITIES';
  entities: Array<Entry | Asset>;
};

type Subscribe = (action: 'REQUESTED_ENTITIES', cb: (message: EditorEntityStoreReceivedMessage) => void) => VoidFunction

export class EditorEntityStore extends EntityStore {
  private requestCache = new Map<string, Promise<any>>();
  private sendMessage: SendMessage;
  private subscribe: Subscribe;

  constructor({
    entities,
    locale,
    sendMessage,
    subscribe,
  }: {
    entities: Array<Entry | Asset>;
    locale: string;
    sendMessage: SendMessage;
    subscribe: Subscribe;
  }) {
    super({ entities, locale });
    this.sendMessage = sendMessage;
    this.subscribe = subscribe;
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

  private findMissingEntites(ids: string[]) {
    const missing = [];

    for (const id of ids) {
      const entry = this.entitiesMap.get(id);
      if (!entry) {
        missing.push(id);
      }
    }

    return missing;
  }

  private async fetchEntity(ids: string[]): Promise<Array<Entry>>;
  private async fetchEntity(ids: string[], isAsset: true): Promise<Array<Asset>>;
  private async fetchEntity(ids: string[], isAsset?: boolean): Promise<Array<Entry | Asset>> {
    const missingIds = this.findMissingEntites(ids);

    if (missingIds.length === 0) {
      // everything is already in cache
      return ids.map(id => this.entitiesMap.get(id)) as Array<Entry | Asset>;
    }

    const cacheId = this.getCacheId(missingIds);
    const openRequest = this.requestCache.get(cacheId);

    if (openRequest) {
      return openRequest;
    }

    const newPromise = new Promise((resolve) => {
      const unsubscribe = this.subscribe('REQUESTED_ENTITIES', (message: EditorEntityStoreReceivedMessage) => {
        if (
          missingIds.every((id) => message.entities.find((entity) => entity.sys.id === id))
        ) {
          resolve(message.entities);

          this.cleanupPromise(cacheId);
          ids.forEach(id => this.cleanupPromise(id));

          unsubscribe();
        }
      });

      this.sendMessage({
        action: 'REQUEST_ENTITIES',
        entityIds: missingIds,
        entityType: isAsset ? 'Asset' : 'Entry',
        locale: this.locale,
      });
    });

    this.requestCache.set(cacheId, newPromise);
    ids.forEach((cid) => {
      this.requestCache.set(cid, newPromise);
    });

    const result = (await newPromise) as Array<Entry | Asset>;

    result.forEach((value) => {
      this.entitiesMap.set(value.sys.id, value);
    });

    return ids.map(id => this.entitiesMap.get(id)) as Array<Entry | Asset>;
  }

  public async fetchAsset(id: string): Promise<Asset> {
    return (await this.fetchAssets([id]))[0];
  }

  public fetchAssets(ids: string[]): Promise<Asset[]> {
    return this.fetchEntity(ids, true);
  }

  public async fetchEntry(id: string): Promise<Entry> {
    return (await this.fetchEntries([id]))[0];
  }

  public fetchEntries(ids: string[]): Promise<Entry[]> {
    return this.fetchEntity(ids);
  }
}
