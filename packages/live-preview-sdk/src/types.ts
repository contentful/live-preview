import type { Asset, Entry } from 'contentful';
import type { ContentTypeProps } from 'contentful-management';

export type ContentType = ContentTypeProps;
export const ASSET_TYPENAME = 'Asset';

export type LivePreviewProps = {
  fieldId: string;
  entryId: string;
  locale?: string;
};

export const enum TagAttributes {
  FIELD_ID = 'data-contentful-field-id',
  ENTRY_ID = 'data-contentful-entry-id',
  LOCALE = 'data-contentful-locale',
}

export type InspectorModeTags = {
  [TagAttributes.ENTRY_ID]: string;
  [TagAttributes.FIELD_ID]: string;
  [TagAttributes.LOCALE]?: string;
} | null;

export interface SysProps {
  id: string;
  [key: string]: unknown;
}

// We had Record<string, any> before, but this will not work with stricter typings
// e.g. contentful client SDK - getEntry & getEntries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Entity = Record<any, any>;

export interface EntityWithSys extends Entity {
  sys: SysProps;
  __typename?: string;
}

export function hasSysInformation(entity: unknown): entity is EntityWithSys {
  return !!(
    entity &&
    typeof entity === 'object' &&
    'sys' in entity &&
    (entity as EntityWithSys).sys.id
  );
}

export type Argument = Entity | Entity[];
export type SubscribeCallback = (data: Argument) => void;

export interface CollectionItem {
  sys: SysProps;
  __typename?: string;
}

export class EntityReferenceMap extends Map<string, Entry | Asset> {}

export type UpdateEntryProps = {
  contentType: ContentType;
  dataFromPreviewApp: Entity & { sys: SysProps };
  updateFromEntryEditor: Entry;
  locale: string;
  entityReferenceMap: EntityReferenceMap;
  gqlParams?: GraphQLParams;
};

export type UpdateFieldProps = {
  dataFromPreviewApp: Entity;
  updateFromEntryEditor: Entry;
  name: string;
  locale: string;
  entityReferenceMap: EntityReferenceMap;
  gqlParams?: GraphQLParams;
};

export type UpdateReferenceFieldProps = {
  referenceFromPreviewApp: (Entity & { __typename?: string }) | null | undefined;
  updatedReference?: (Pick<Entry, 'sys'> | Pick<Asset, 'sys'>) & { __typename?: string };
  entityReferenceMap: EntityReferenceMap;
  locale: string;
  gqlParams?: GraphQLParams;
};

/**
 * Generated params based on the DocumentNode of the query
 */
export interface GraphQLParam {
  /** Map with aliases (name, alias) */
  alias: Map<string, string>;
  /** Set with all requested fields for this __typename */
  fields: Set<string>;
}

/**
 * Map with the aliases for GraphQL fields
 * clustered by `__typename`
 */
export type GraphQLParams = Map<string, GraphQLParam>;

export interface Subscription {
  data: Argument;
  locale?: string;
  callback: SubscribeCallback;
  gqlParams?: GraphQLParams;
}
