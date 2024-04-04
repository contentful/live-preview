export type Source = {
  field: number;
  locale: number;
  fieldType: number;
  editorInterface: number;
} & ({ entry: number } | { asset: number });

export interface EntitySource {
  space: number;
  environment: number;
  id: string;
}

export type Mappings = Record<string, { source: Source }>;

type FieldType = 'Symbol' | 'Text' | 'RichText' | 'Array';

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

interface EditorInterfaceSource {
  widgetId: WidgetId;
  widgetNamespace: WidgetNamespace;
}

interface ContentSourceMaps {
  version: number;
  spaces: string[];
  environments: string[];
  fieldTypes: FieldType[];
  editorInterfaces: EditorInterfaceSource[];
  fields: string[];
  locales: string[];
  entries: EntitySource[];
  assets: EntitySource[];
  mappings: Mappings;
}

export interface GraphQLResponse {
  data: any;
  extensions: {
    contentSourceMaps: ContentSourceMaps;
  };
}
