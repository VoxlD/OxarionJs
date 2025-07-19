function parseURLPath(url: string): string {
  let path_start = 0;
  let path_end = url.length;
  let i = 0;

  while (i < url.length - 2) {
    if (url[i + 1] === "/" && url[i + 2] === "/") {
      i += 3;
      while (i < url.length && url[i] !== "/") i++;
      path_start = i;
      break;
    }
    i++;
  }

  i = path_start;
  while (i < url.length) {
    if (url[i] === "?") {
      path_end = i;
      break;
    }
    i++;
  }

  return url.slice(path_start, path_end);
}

export { parseURLPath };
