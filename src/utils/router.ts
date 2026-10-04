import { useState, useEffect } from 'react';

export interface RouteState {
  page:
    | 'home'
    | 'category'
    | 'article'
    | 'search'
    | 'about'
    | 'contact'
    | 'epaper'
    | 'bookmarks'
    | 'timeline'
    | 'editorial'
    | 'editorial-desk';
  params: {
    id?: string;
    slug?: string;
    query?: string;
    storyId?: string;
  };
}

export const getCurrentPath = (): string => {
  if (typeof window === 'undefined') return '';
  if (window.location.hash) {
    return window.location.hash.replace(/^#+\/?/, '');
  }
  const pathname = window.location.pathname.replace(/^\/+/, '');
  if (pathname && !pathname.endsWith('.html') && pathname !== 'index') {
    return pathname;
  }
  return '';
};

export const parseHash = (hashOrPath?: string): RouteState => {
  let raw = hashOrPath;
  if (raw === undefined || raw === '') {
    raw = getCurrentPath();
  }

  // Strip leading '#', '/#/', '#/', or '/'
  let cleanPath = raw.trim();
  cleanPath = cleanPath.replace(/^#+\/?/, '').replace(/^\/+/, '');

  if (!cleanPath) {
    return { page: 'home', params: {} };
  }

  // Extract query parameters if present
  const [pathOnly, queryString] = cleanPath.split('?');
  const urlParams = new URLSearchParams(queryString || '');
  const pathNormalized = pathOnly.replace(/\/+$/, '');
  const parts = pathNormalized.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { page: 'home', params: {} };
  }

  // Check search route
  if (parts[0] === 'search') {
    return {
      page: 'search',
      params: { query: urlParams.get('q') || parts[1] || '' },
    };
  }

  // Explicit private Editorial Desk routes
  if (
    parts[0] === 'editorial-desk' ||
    parts[0] === 'editorial_desk' ||
    parts[0] === 'editorialdesk' ||
    parts[0] === 'editorial-dashboard' ||
    (parts[0] === 'editorial' && parts[1] === 'desk') ||
    (parts[0] === 'category' && (parts[1] === 'editorial-desk' || parts[1] === 'editorial_desk'))
  ) {
    const storyId =
      parts[0] === 'editorial' && parts[1] === 'desk'
        ? parts[2]
        : parts[0] === 'category'
        ? parts[2]
        : parts[1];
    return {
      page: 'editorial-desk',
      params: { storyId: storyId || undefined },
    };
  }

  // Public संपादकीय (Editorial & Opinion) category route
  if (
    (parts[0] === 'editorial' && (!parts[1] || parts[1] === 'opinion')) ||
    (parts[0] === 'category' && parts[1] === 'editorial')
  ) {
    return { page: 'editorial', params: {} };
  }

  // Other standard categories
  if (parts[0] === 'category' && parts[1]) {
    return {
      page: 'category',
      params: { slug: parts[1] },
    };
  }

  // Slug-based article routing
  if (parts[0] === 'article' && parts[1]) {
    return {
      page: 'article',
      params: { slug: parts[1], id: parts[1] },
    };
  }

  if (parts[0] === 'about') return { page: 'about', params: {} };
  if (parts[0] === 'contact') return { page: 'contact', params: {} };
  if (parts[0] === 'epaper') return { page: 'epaper', params: {} };
  if (parts[0] === 'bookmarks') return { page: 'bookmarks', params: {} };
  if (parts[0] === 'timeline') return { page: 'timeline', params: {} };

  // Strict: Any unknown route strictly defaults to home, NEVER public editorial
  return { page: 'home', params: {} };
};

export const navigateTo = (path: string) => {
  const formatted = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
  window.location.hash = formatted;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const useRouter = () => {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  return {
    route,
    navigateTo,
  };
};
