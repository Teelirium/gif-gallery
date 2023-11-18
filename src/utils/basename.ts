/**
 * Probably equivalent to node's path.basename
 */
export function basename(filepath: string): string {
  const isWindows = api.isWindows;
  const separator = isWindows ? "\\" : "/";
  const tokens = filepath.split(separator);
  return tokens[tokens.length - 1];
}
