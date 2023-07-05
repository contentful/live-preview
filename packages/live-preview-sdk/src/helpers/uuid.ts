/**
 * Cheap solution to generate a unique ID
 */
export function generateUID(): string {
  return `${performance.now()}-${Math.random().toString(36).slice(2)}`;
}
