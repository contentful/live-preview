import type { Asset, Entry, UnresolvedLink } from 'contentful';
import { get } from './utils';

/**
 * Base Store for entities
 * Can be extened for the different loading behaviours (editor, production, ..)
 */
export class EntityStore {
  protected locale: string
  protected entitiesMap: Map<string, Entry | Asset>;

  constructor({ entities, locale }: { entities: Array<Entry | Asset>, locale: string }) {
    this.entitiesMap = new Map(entities.map((entity) => [entity.sys.id, entity]));
    this.locale = locale
  }

  public get entities() {
    return [...this.entitiesMap.values()];
  }

  public updateEntity(entity: Entry | Asset) {
    this.entitiesMap.set(entity.sys.id, entity);
  }

  public getValue(
    entityLink: UnresolvedLink<'Entry' | 'Asset'>,
    path: string[]
  ): string | undefined {
    const entity = this.entitiesMap.get(entityLink.sys.id);

    if (!entity || entity.sys.type !== entityLink.sys.linkType) {
      console.warn(`Composition references unresolved entity: ${entityLink}`);
      return;
    }

    return get<string>(entity, path);
  }

  private getEntitiesFromMap(ids: string[]) {
    const entity = [];
    const missingEntityIds = [];

    for (const id of ids) {
      const entry = this.entitiesMap.get(id);
      if (entry) {
        entity.push(entry);
      } else {
        missingEntityIds.push(id);
      }
    }

    if (missingEntityIds.length) {
      throw new Error(`Missing entity in the store (${missingEntityIds.join(',')})`);
    }

    return entity as Array<Asset | Entry>;
  }

  public async fetchAsset(id: string): Promise<Asset> {
    return this.getEntitiesFromMap([id])[0] as Asset;
  }
  public async fetchAssets(ids: string[]): Promise<Asset[]> {
    return this.getEntitiesFromMap(ids) as Asset[];
  }

  public async fetchEntry(id: string): Promise<Entry> {
    return this.getEntitiesFromMap([id])[0] as Entry;
  }

  public async fetchEntries(ids: string[]): Promise<Entry[]> {
    return this.getEntitiesFromMap(ids) as Entry[];
  }
}
