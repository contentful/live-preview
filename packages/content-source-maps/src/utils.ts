import { set } from 'json-pointer';

import { combine } from './encode.js';
import { encodeRichTextValue } from './richText.js';
import type {
  CPAEntry,
  CPAMappings,
  EditorInterfaceSource,
  FieldType,
  GraphQLMappings,
  GraphQLResponse,
  SourceMapMetadata,
  WidgetId,
  WidgetNamespace,
} from './types.js';

export const createSourceMapMetadata = ({
  entityId,
  entityType,
  space,
  environment,
  field,
  locale,
  editorInterface,
  fieldType,
  targetOrigin,
}: {
  entityId: string;
  entityType: string;
  space: string;
  environment: string;
  field: string;
  locale: string;
  editorInterface: EditorInterfaceSource;
  fieldType: string;
  targetOrigin?: 'https://app.contentful.com' | 'https://app.eu.contentful.com';
}): SourceMapMetadata => {
  const targetOriginUrl = targetOrigin || 'https://app.contentful.com';
  const basePath = `${targetOriginUrl}/spaces/${space}/environments/${environment}`;
  const entityRoute = entityType === 'Entry' ? 'entries' : 'assets';
  const href = `${basePath}/${entityRoute}/${entityId}/?focusedField=${field}&focusedLocale=${locale}`;

  return {
    origin: 'contentful.com',
    href,
    contentful: {
      space,
      environment,
      field,
      locale,
      entity: entityId,
      entityType,
      editorInterface,
      fieldType,
    },
  };
};

export const isBuiltinNamespace = (namespace: WidgetNamespace) =>
  ['builtin', 'sidebar-builtin', 'editor-builtin'].includes(namespace);
export const isSupportedWidget = (widgetId: WidgetId) => SUPPORTED_WIDGETS.includes(widgetId);

/**
 * Clones the incoming element into a new one, to prevent modification on the original object
 * Hint: It uses the structuredClone which is only available in modern browsers,
 * for older one it uses the JSON.parse(JSON.stringify) hack.
 */
export function clone<T extends Record<string, unknown> | Array<unknown>>(incoming: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(incoming);
  }

  try {
    return JSON.parse(JSON.stringify(incoming));
  } catch (err) {
    console.warn('Failed to clone data:', incoming, err);
    return incoming;
  }
}

export const SUPPORTED_WIDGETS: WidgetId[] = [
  'singleLine',
  'tagEditor',
  'listInput',
  'checkbox',
  'richTextEditor',
  'multipleLine',
  'markdown',
];

export function encodeField(
  fieldType: FieldType,
  currentValue: any,
  hiddenStrings: SourceMapMetadata,
  target: GraphQLResponse | CPAEntry,
  pointer: string,
  mappings: CPAMappings | GraphQLMappings,
  locale?: string,
) {
  // Determine the value based on locale (if provided)
  const value = locale ? currentValue[locale] : currentValue;

  // Process based on fieldType
  switch (fieldType) {
    case 'Symbol': {
      const encodedValue = combine(value, hiddenStrings);
      set(target, pointer, encodedValue);
      break;
    }

    case 'RichText': {
      encodeRichTextValue({
        pointer: '',
        mappings,
        data: value,
        hiddenStrings,
      });
      break;
    }

    case 'Array': {
      const encodedArray = value.map((item: unknown) => {
        if (typeof item === 'string') {
          return combine(item, hiddenStrings);
        } else {
          return item; // Return the item unchanged if it's not a string
        }
      });
      set(target, pointer, encodedArray);
      break;
    }
  }
}
