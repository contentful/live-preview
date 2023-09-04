import type { DocumentNode, FieldNode, SelectionNode } from 'graphql';

import { debug } from '../helpers';
import type { GraphQLParams } from '../types';
import { buildCollectionName, extractNameFromCollectionName } from './utils';

interface GeneratedGraphQLStructure {
  name: string;
  alias?: string;
  __typename: string;
}

/**
 * Generates the typename for the next node
 * If it's inside a collection it will provide the typename from the collection name
 */
function getTypeName(selection: FieldNode, prevTypeName: string): string {
  if (selection.name.value === 'items') {
    return extractNameFromCollectionName(prevTypeName) || selection.name.value;
  }

  return selection.name.value;
}

/**
 * Takes a list of graphql fields and extract the field names and aliases for the live update processing
 */
function gatherFieldInformation(
  selections: Readonly<SelectionNode[]>,
  typename: string
): GeneratedGraphQLStructure[] {
  const generated: GeneratedGraphQLStructure[] = [];

  for (const selection of selections) {
    if (selection.kind === 'Field') {
      generated.push({
        name: selection.name.value,
        alias: selection.alias?.value,
        __typename: typename,
      });

      if (selection.selectionSet?.selections) {
        generated.push(
          ...gatherFieldInformation(
            selection.selectionSet.selections,
            getTypeName(selection, typename)
          )
        );
      }
    }
  }

  return generated;
}

/**
 * Parses the GraphQL query information and extracts the information,
 * we're using for processing the live updates (requested fields, alias)
 */
export function parseGraphQLParams(query: DocumentNode): GraphQLParams {
  const generated: GeneratedGraphQLStructure[] = [];

  for (const def of query.definitions) {
    if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
      const typename = 'typeCondition' in def ? def.typeCondition.name.value : def.name?.value;

      if (!typename) {
        debug.warn('Could not generate __typename for query definition', def);
        continue;
      }

      for (const selection of def.selectionSet.selections) {
        if (selection.kind === 'Field') {
          generated.push(...gatherFieldInformation(def.selectionSet.selections, typename));
        }
      }
    }
  }

  // Transform the list of GraphQL information into a Map for faster access
  // (by __typename)
  const params: GraphQLParams = new Map();
  for (const { __typename, alias, name } of generated) {
    const match = params.get(__typename) || {
      alias: new Map<string, string>(),
      fields: new Set<string>(),
    };

    match.fields.add(name);
    if (alias) {
      match.alias.set(name, alias);
    }

    params.set(__typename, match);
  }

  return params;
}

/**
 * Checks if the current field is relevant for the update processing.
 * This speeds up the update time especially for references and prevents wrong-positives when working with alias.
 * If used without the GraphQL query information, it will always return `true`.
 */
export function isRelevantField(
  name: string,
  typename: string,
  gqlParams?: GraphQLParams
): boolean {
  if (!gqlParams) {
    return true;
  }

  const queryInformation = gqlParams.get(typename);
  if (!queryInformation) {
    return false;
  }

  return (
    queryInformation.fields.has(name) || queryInformation.fields.has(buildCollectionName(name))
  );
}

/**
 * Updates the provided information by mirroring the original data to the alias
 */
export function updateAliasedInformation<T>(
  data: T,
  typename: string,
  gqlParams?: GraphQLParams
): T {
  const aliases = gqlParams?.get(typename)?.alias;

  if (!aliases) {
    return data;
  }

  for (const key in data) {
    const alias = aliases?.get(key);
    if (alias !== key) {
      data[alias as keyof T] = data[key];
    }
  }

  return data;
}
