export function basename(path: string) {
  if (path.includes("\\")) {
    const tokens = path.split("\\");
    return tokens[tokens.length - 1];
  }
  return "";
}
