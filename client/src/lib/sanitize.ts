/**
 * Client-side HTML and URL sanitization helpers for untrusted ATS and
 * externally imported job postings.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "hr",
  "code",
  "pre",
  "div",
  "span",
  "a",
]);

const STRIP_ENTIRE_BLOCK_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "meta",
  "link",
  "base",
  "noscript",
  "template",
]);

const BASIC_ENTITY_MAP: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&amp;": "&",
  "&nbsp;": " ",
};

/**
 * Validates that a URL uses an explicit http: or https: protocol.
 * Returns the normalized URL string or null if invalid/unsafe.
 */
export function getSafeExternalUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtmlEntitiesOnce(raw: string): string {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = raw;
    return textarea.value;
  }

  return raw
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(
      /&(?:lt|gt|quot|amp|nbsp|#39|#x27);/gi,
      (entity) => BASIC_ENTITY_MAP[entity.toLowerCase()] ?? entity,
    );
}

function sanitizeDomNode(node: Node, targetDoc: Document): Node | null {
  if (node.nodeType === 3 /* Node.TEXT_NODE */) {
    return targetDoc.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) {
    return null;
  }

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (STRIP_ENTIRE_BLOCK_TAGS.has(tag)) {
    return null;
  }

  const childNodes = Array.from(el.childNodes);

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = targetDoc.createDocumentFragment();
    for (const child of childNodes) {
      const cleanChild = sanitizeDomNode(child, targetDoc);
      if (cleanChild) fragment.appendChild(cleanChild);
    }
    return fragment;
  }

  const cleanEl = targetDoc.createElement(tag);

  if (tag === "a") {
    const safeHref = getSafeExternalUrl(el.getAttribute("href"));
    if (safeHref) {
      cleanEl.setAttribute("href", safeHref);
      cleanEl.setAttribute("target", "_blank");
      cleanEl.setAttribute("rel", "noopener noreferrer");
    }
  }

  for (const child of childNodes) {
    const cleanChild = sanitizeDomNode(child, targetDoc);
    if (cleanChild) cleanEl.appendChild(cleanChild);
  }

  return cleanEl;
}

function sanitizeHtmlWithoutDom(decoded: string): string {
  // Remove dangerous block elements and their inner payloads first
  let working = decoded.replace(
    /<\s*(script|style|iframe|object|embed|svg|math|form|noscript|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  // Remove self-closing / unclosed dangerous tags & HTML comments
  working = working.replace(/<!--[\s\S]*?-->/g, "");
  working = working.replace(
    /<\s*\/?\s*(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button|meta|link|base|noscript|template)\b[^>]*>/gi,
    "",
  );

  // Strip or rebuild remaining tags strictly against ALLOWED_TAGS
  return working.replace(
    /<(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g,
    (_full, closingSlash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }

      if (closingSlash === "/") {
        return tag === "br" || tag === "hr" ? "" : `</${tag}>`;
      }

      if (tag === "br" || tag === "hr") {
        return `<${tag}>`;
      }

      if (tag === "a") {
        const hrefMatch = rawAttrs.match(
          /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
        );
        const rawHref = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "";
        const safeHref = getSafeExternalUrl(rawHref);
        if (safeHref) {
          return `<a href="${escapeHtmlText(safeHref)}" target="_blank" rel="noopener noreferrer">`;
        }
        return "<a>";
      }

      return `<${tag}>`;
    },
  );
}

/**
 * Decodes ATS-encoded job descriptions and sanitizes HTML strictly to safe
 * formatting elements so untrusted postings cannot inject scripts or event handlers.
 */
export function sanitizeJobDescriptionHtml(rawHtml?: string | null): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  // ATS feeds (like Greenhouse) often HTML-encode markup once (&lt;p&gt;...&lt;/p&gt;)
  const decoded =
    rawHtml.includes("&lt;") || rawHtml.includes("&#60;")
      ? decodeHtmlEntitiesOnce(rawHtml)
      : rawHtml;

  if (typeof DOMParser !== "undefined" && typeof document !== "undefined") {
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(decoded, "text/html");
    const container = document.createElement("div");

    for (const child of Array.from(parsedDoc.body.childNodes)) {
      const cleanChild = sanitizeDomNode(child, document);
      if (cleanChild) {
        container.appendChild(cleanChild);
      }
    }

    return container.innerHTML;
  }

  return sanitizeHtmlWithoutDom(decoded);
}
