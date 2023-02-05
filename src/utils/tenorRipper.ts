const parser = new DOMParser();

export async function ripGif(url: string) {
  const gifUrl = await fetch(url)
    .then((res) => res.text())
    .then((raw) => parser.parseFromString(raw, "text/html"))
    .then((doc) => {
      return doc.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");
    });
  console.log(gifUrl);
  return gifUrl;
}
