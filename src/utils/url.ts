export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized) return '';
  
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

export function combineUrlWithPath(baseUrl: string, subPath: string): string {
  const base = normalizeUrl(baseUrl);
  let path = subPath.trim();
  
  if (!path) return base;
  
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  
  if (base.endsWith('/')) {
    return base + path;
  }
  
  return base + '/' + path;
}

export function extractDomain(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
