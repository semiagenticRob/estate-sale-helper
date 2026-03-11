export interface LastSearch {
  query: string;
  latitude: string;
  longitude: string;
  radius: string;
  dateRange: string;
  [key: string]: string;
}

let lastSearch: LastSearch | null = null;

export function setLastSearch(params: LastSearch) {
  lastSearch = params;
}

export function getLastSearch(): LastSearch | null {
  return lastSearch;
}
