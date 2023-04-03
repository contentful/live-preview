import { Entity, SysProps } from '../types';

export function hasNestedReference(data: Entity | Entity[], updateSysId: string): boolean {
  if ('sys' in data && (data.sys as SysProps).id === updateSysId) {
    return true;
  }

  const iterateable = Array.isArray(data) ? data : Object.values(data);

  for (const value of iterateable) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const arrayValue of value) {
        const match = hasNestedReference(arrayValue, updateSysId);

        if (match) {
          return true;
        }
      }
    }

    if (typeof value === 'object') {
      const match = hasNestedReference(value as Entity, updateSysId);
      if (match) {
        return true;
      }
    }
  }

  return false;
}
