export type DeckView = "play" | "presenter" | "overview" | "print";

export interface DeckLocation {
  readonly view: DeckView;
  readonly slide: number;
  readonly click: number;
  readonly embedded: boolean;
  readonly bridge: boolean;
}

export function parseLocation(hash: string, search: string): DeckLocation {
  const queryAt = hash.indexOf("?");
  const path = queryAt < 0 ? hash : hash.slice(0, queryAt);
  const hashParams = new URLSearchParams(queryAt < 0 ? "" : hash.slice(queryAt + 1));
  const searchParams = new URLSearchParams(search);
  const embedded = searchParams.get("embedded");
  const bridge = searchParams.get("decks-bridge");
  const flags = {
    embedded: embedded !== null && embedded !== "0" && embedded !== "false",
    bridge: bridge !== null && bridge !== "0" && bridge !== "false",
  };
  if (path === "#/overview" || path === "#/print") {
    return { view: path === "#/overview" ? "overview" : "print", slide: 1, click: 0, ...flags };
  }
  const play = /^#\/(\d+)$/.exec(path);
  const presenter = /^#\/presenter(?:\/(\d+))?$/.exec(path);
  const slide = Number(play?.[1] ?? presenter?.[1] ?? 1);
  if (
    (!play && !presenter && path !== "" && path !== "#" && path !== "#/") ||
    !Number.isInteger(slide)
  ) {
    return { view: "play", slide: 1, click: 0, ...flags };
  }
  const rawClicks = hashParams.get("clicks") ?? "";
  const clicks = /^\d+$/.test(rawClicks) ? Number(rawClicks) : 0;
  return {
    view: presenter ? "presenter" : "play",
    slide,
    click: Number.isInteger(clicks) ? clicks : 0,
    ...flags,
  };
}

export function formatHash(location: Pick<DeckLocation, "view" | "slide" | "click">): string {
  if (location.view === "overview" || location.view === "print") {
    return `#/${location.view}`;
  }
  const prefix = location.view === "presenter" ? "#/presenter/" : "#/";
  const clicks = location.click === 0 ? "" : `?clicks=${location.click}`;
  return `${prefix}${location.slide}${clicks}`;
}
