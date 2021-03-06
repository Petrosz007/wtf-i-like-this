export function getTrackIdFromURL(url: string): string | null {
  const matches = /\/track\/([a-zA-Z0-9]*)/.exec(url);

  if (matches?.length !== 2) return null;

  return matches[1];
}

export function getPlaylistIdFromURL(url: string): string | null {
  const matches = /\/playlist\/([a-zA-Z0-9]*)/.exec(url);

  if (matches?.length !== 2) return null;

  return matches[1];
}
