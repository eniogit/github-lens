export function findMaxFromLinkHeader(linkHeader: string): number {
  const regex = /(?:\?|&)page=(\d+)/gm;

  const match = linkHeader?.matchAll(regex);

  let max = 1;
  for (const m of match ?? []) {
    const pageNum = parseInt(m[1]);
    if (pageNum > max) {
      max = pageNum;
    }
  }
  return max;
}
