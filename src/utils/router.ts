import { useState, useEffect } from 'react';

export interface RouteState {
  page: 'home' | 'category' | 'article' | 'search' | 'about' | 'contact' | 'epaper' | 'bookmarks' | 'timeline' | 'editorial';
  params: {
    id?: string;
    slug?: string;
    query?: string;
  };
}

export const getCurrentPath = (): string => {
  if (typeof window === 'undefined') return '';
  if (window.location.hash) {
    return window.location.hash.replace(/^#\/?/, '');
  }
  const pathname = window.location.pathname.replace(/^\//, '');
  if (pathname && !pathname.endsWith('.html') && pathname !== 'index') {
    return pathname;
  }
  return '';
};

export const parseHash = (hashString?: string): RouteState => {
  const cleanPath = (hashString !== undefined ? hashString.replace(/^#\/?/, '') : getCurrentPath()).trim();

  if (!cleanPath) {
    return { page: 'home', params: {} };
  }

  // Check search route
  if (cleanPath.startsWith('search')) {
    const queryPart = cleanPath.includes('?') ? cleanPath.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryPart);
    return {
      page: 'search',
      params: { query: urlParams.get('q') || '' },
    };
  }

  const parts = cleanPath.split('/');

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

  if (parts[0] === 'about') {
    return { page: 'about', params: {} };
  }

  if (parts[0] === 'contact') {
    return { page: 'contact', params: {} };
  }

  if (parts[0] === 'epaper') {
    return { page: 'epaper', params: {} };
  }

  if (parts[0] === 'bookmarks') {
    return { page: 'bookmarks', params: {} };
  }

  if (parts[0] === 'timeline') {
    return { page: 'timeline', params: {} };
  }

  if (parts[0] === 'editorial') {
    return { page: 'editorial', params: {} };
  }

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
