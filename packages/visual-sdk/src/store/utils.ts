export function get<T>(obj: Record<string, any>, path: string[]): T | undefined {
  if (!path.length) {
    return obj as T;
  }

  try {
    const [currentPath, ...nextPath] = path;
    return get(obj[currentPath], nextPath);
  } catch (err) {
    return undefined;
  }
}
