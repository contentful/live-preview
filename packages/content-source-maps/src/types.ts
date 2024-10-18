import type {
  AssetSys,
  Entry as ContentfulEntry,
  EntryCollection as ContentfulEntryCollection,
  EntrySys as ContentfulEntrySys,
  EntrySkeletonType,
} from 'contentful';

type ContentfulMetadata = {
  editorInterface: {
    widgetNamespace: string;
    widgetId: string;
  };
  fieldType: string;
};

export type SourceMapMetadata = {
  origin: string;
} & (
  | { href: string; contentful?: ContentfulMetadata }
  | { href?: string; contentful: ContentfulMetadata }
);

export type CreateSourceMapParams = {
  entityId: string;
  entityType: 'Entry' | 'Asset';
  space: string;
  environment: string;
  field: string;
  locale: string;
  editorInterface: EditorInterfaceSource;
  fieldType: string;
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com';
  platform?: 'contentful' | 'vercel';
};

export type Source = {
  field: number;
  locale: number;
  fieldType: number;
  editorInterface: number;
} & ({ entry: number } | { asset: number });
// Source type specific to CPA, limited to editorInterface and fieldType
export type CPASource = Pick<Source, 'editorInterface' | 'fieldType'>;
// GraphQL uses the full Source type
export type GraphQLSource = Source;

export interface EntitySource {
  space: number;
  environment: number;
  id: string;
}

export type CPAMappings = Record<string, { source: CPASource }>;
export type GraphQLMappings = Record<string, { source: GraphQLSource }>;

export type FieldType = 'Symbol' | 'Text' | 'RichText' | 'Array';

export type WidgetId =
  | 'multipleLine'
  | 'boolean'
  | 'objectEditor'
  | 'datePicker'
  | 'locationEditor'
  | 'checkbox'
  | 'listInput'
  | 'rating'
  | 'radio'
  | 'tagEditor'
  | 'numberEditor'
  | 'urlEditor'
  | 'slugEditor'
  | 'singleLine'
  | 'dropdown'
  | 'entryLinkEditor'
  | 'entryCardEditor'
  | 'entryLinksEditor'
  | 'entryCardsEditor'
  | 'assetLinkEditor'
  | 'assetLinksEditor'
  | 'assetGalleryEditor'
  | 'richTextEditor'
  | 'markdown'
  | string; //Custom Contentful field app

export type WidgetNamespace =
  | 'builtin'
  | 'extension'
  | 'sidebar-builtin'
  | 'app'
  | 'editor-builtin';

export interface EditorInterfaceSource {
  widgetId: WidgetId;
  widgetNamespace: WidgetNamespace;
}

interface ContentSourceMaps {
  sys: { type: 'ContentSourceMaps' };
  spaces: string[];
  environments: string[];
  fieldTypes: FieldType[];
  editorInterfaces: EditorInterfaceSource[];
  fields: string[];
  locales: string[];
  entries: EntitySource[];
  assets: EntitySource[];
}
export type CPAContentSourceMaps = Pick<ContentSourceMaps, 'sys'> & { mappings: CPAMappings };
type GraphQLContentSourceMaps = Omit<ContentSourceMaps, 'sys'> & {
  mappings: GraphQLMappings;
};

export interface ContentSourceMapsLookup {
  sys: { type: 'ContentSourceMapsLookup' };
  fieldTypes: FieldType[];
  editorInterfaces: EditorInterfaceSource[];
}

export interface GraphQLResponse {
  data: any;
  extensions: {
    contentSourceMaps: GraphQLContentSourceMaps;
  };
}

export interface ExtendedSys extends ContentfulEntrySys {
  contentSourceMapsLookup?: ContentSourceMapsLookup;
  contentSourceMaps?: CPAContentSourceMaps;
}

export interface ExtendedAssetSys extends AssetSys {
  contentSourceMapsLookup?: ContentSourceMapsLookup;
  contentSourceMaps?: CPAContentSourceMaps;
}

export interface CPAEntry<TFields extends EntrySkeletonType = EntrySkeletonType>
  extends ContentfulEntry<TFields> {
  sys: ExtendedSys;
  fields: TFields['fields'];
}

export interface CPAEntryCollection<TFields extends EntrySkeletonType = EntrySkeletonType>
  extends ContentfulEntryCollection<TFields> {
  items: CPAEntry<TFields>[];
}
