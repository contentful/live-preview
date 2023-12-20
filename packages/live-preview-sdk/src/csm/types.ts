export type Source = {
  field: number;
  locale: number;
} & ({ entry: number } | { asset: number });

export interface EntitySource {
  space: number;
  environment: number;
  id: string;
}

type Mappings = Record<string, { source: Source }>;

interface IContentSourceMaps {
  version: number;
  spaces: string[];
  environments: string[];
  fields: string[];
  locales: string[];
  entries: EntitySource[];
  assets: EntitySource[];
  mappings: Mappings;
}

export interface GraphQLResponse {
  data: any;
  extensions: {
    contentSourceMaps: IContentSourceMaps;
  };
}
