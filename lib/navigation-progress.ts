export type RouteProgressClick = {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  target: unknown;
};

type RouteProgressAnchor = {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
};

export function getInternalNavigationHref(event: RouteProgressClick): string | null {
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;

  const target = event.target as { closest?: (selector: string) => RouteProgressAnchor | null } | null;
  const anchor = target?.closest?.("a[href]");
  if (!anchor || anchor.hasAttribute("download")) return null;

  const linkTarget = anchor.getAttribute("target");
  if (linkTarget && linkTarget.toLowerCase() !== "_self") return null;

  const href = anchor.getAttribute("href");
  if (!href?.startsWith("/") || href.startsWith("//")) return null;
  return href.split(/[?#]/u, 1)[0];
}
