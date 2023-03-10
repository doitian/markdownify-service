import Turndown from "turndown";
import * as TurndownPluginGfm from "turndown-plugin-gfm";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  const { url, html } = await mayFetch(req);
  const text = markdownify(url, html, req.body.includingMetadata);
  res.status(200).json({ text });
}

function getFileName(fileName) {
  if (present(fileName)) {
    return fileName
      .replaceAll(":", "")
      .replace(/[/\\?%*|"<>]/g, "-")
      .replace(/[- .]+$/, "");
  }
}

async function mayFetch(req) {
  const { url, html } = req.body;

  if (!present(html)) {
    const resp = await fetch(req.body.url);
    const fetchedHTML = await resp.text();
    return { url, html: fetchedHTML };
  } else {
    return { url, html };
  }
}

function present(thing) {
  return thing !== null && thing !== undefined && thing.trim() !== "";
}

function markdownify(url, html, includingMetadata = false) {
  const document = new JSDOM(html, { url }).window.document;
  const { title, byline, content } = new Readability(document).parse() || {
    title: document.title,
    byline: null,
    content: document.body,
  };

  const turndownService = new Turndown({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });
  turndownService.use(TurndownPluginGfm.gfm);

  const text = turndownService.turndown(content);
  const fileName = getFileName(
    present(byline) ? `${byline} - ${title}` : title
  );

  console.log({ includingMetadata });
  const metadata = includingMetadata
    ? parseMetadata({ url, title, byline, content })
    : "";

  const h1 = present(fileName) ? `# ${fileName}\n\n` : '';

  return `${h1}${metadata}${text}`;
}

function formatMetadata(metadata) {
  return Object.entries(metadata)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      return `**${key}**:: ${value}`;
    })
    .join("\n");
}

function parseMetadata({ url, title, byline, content }) {
  const metadata = {
    Created: `[[${new Date().toISOString().split("T")[0]}]]`,
    Status: "#i",
    Zettel: "#zettel/fleeting",
    Source: "#from/clipper",
  };
  if (present(title)) {
    metadata["Title"] = title.trim();
  }
  const host = url.split("://", 2)[1].split("/", 1)[0];
  metadata["URL"] = `[${host}](${url})`;
  metadata["Host"] = `[[${host}]]`;
  if (present(byline)) {
    metadata["Author"] = `[[${byline}]]`;
  }
  return ["## Metadata\n", formatMetadata(metadata), "\n## Synopsis\n\n"].join(
    "\n"
  );
}
