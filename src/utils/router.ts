import { useState, useEffect } from 'react';

export interface RouteState {
  page: 'home' | 'category' | 'article' | 'search' | 'about' | 'contact' | 'epaper' | 'bookmarks';
  params: {
    id?: string;
    slug?: string;
    query?: string;
  };
}

export const parseHash = (hash: string): RouteState => {
  const cleanHash = hash.replace(/^#\/?/, '');

  if (!cleanHash) {
    return { page: 'home', params: {} };
  }

  // Check search
  if (cleanHash.startsWith('search')) {
    const queryPart = cleanHash.includes('?') ? cleanHash.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryPart);
    return {
      page: 'search',
      params: { query: urlParams.get('q') || '' },
    };
  }

  const parts = cleanHash.split('/');

  if (parts[0] === 'category' && parts[1]) {
    return {
      page: 'category',
      params: { slug: parts[1] },
    };
  }

  if (parts[0] === 'article' && parts[1]) {
    return {
      page: 'article',
      params: { id: parts[1] },
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
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return {
    route,
    navigateTo,
  };
};
