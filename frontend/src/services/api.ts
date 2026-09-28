/**
 * AgroDex Centralized API Service & Request Interceptor
 * Dynamically resolves backend base URL for local development & Vercel production.
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicit Vite environment variable
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_API_URL && typeof metaEnv.VITE_API_URL === 'string' && metaEnv.VITE_API_URL.trim() !== '') {
    return metaEnv.VITE_API_URL.trim().replace(/\/+$/, '');
  }

  // 2. Saved API URL in localStorage (e.g. from developer/admin settings)
  try {
    const saved = localStorage.getItem('agri_api_url');
    if (saved && typeof saved === 'string' && saved.trim() !== '') {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  // 3. Localhost / 127.0.0.1 development fallback (uses Vite proxy)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }

  // 4. In production without VITE_API_URL, default to deployed Render backend
  return 'https://agrodex-backend.onrender.com';
};

/**
 * Resolves a relative endpoint (e.g. '/api/orders') to a fully qualified URL
 */
export const apiUrl = (endpoint: string): string => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://') || endpoint.startsWith('blob:') || endpoint.startsWith('data:')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${normalizedEndpoint}` : normalizedEndpoint;
};

/**
 * Authenticated API Fetch Wrapper
 */
export const apiFetch = async (endpoint: string, init?: RequestInit): Promise<Response> => {
  const url = apiUrl(endpoint);
  const options = init ? { ...init } : {};
  const headers = new Headers(options.headers || {});

  // Automatically attach auth bearer token if available
  try {
    const token = localStorage.getItem('agri_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // ignore
  }

  options.headers = headers;

  const response = await fetch(url, options);

  // Check if server returned unexpected HTML (e.g. Vercel fallback rewrite instead of API backend)
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok && contentType.includes('text/html') && endpoint.startsWith('/api')) {
    console.error(`[AgroDex API Error] ${endpoint} returned HTML error page instead of API response.`);
    throw new Error(
      `Backend API unreachable at ${url}. If deployed on Vercel, ensure VITE_API_URL is set to your Render backend.`
    );
  }

  return response;
};

/**
 * Install global fetch patch so that existing fetch('/api/...') calls in all components
 * automatically benefit from base URL routing and token injection.
 */
let isFetchPatched = false;

export const installGlobalFetchInterceptor = () => {
  if (isFetchPatched || typeof window === 'undefined') return;
  isFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);

    // If calling local relative /api or /uploads, rewrite to base URL
    if (urlStr.startsWith('/api') || urlStr.startsWith('/uploads')) {
      const base = getApiBaseUrl();
      if (base) {
        urlStr = `${base}${urlStr}`;
      }
    }

    const options = init ? { ...init } : {};
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : {}));

    try {
      const token = localStorage.getItem('agri_token');
      if (token && !headers.has('Authorization') && (urlStr.includes('/api/') || urlStr.startsWith('/api'))) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // ignore
    }

    options.headers = headers;

    const response = await originalFetch(urlStr, options);

    // Validate if an API call returned HTML unexpectedly
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 404 && contentType.includes('text/html') && (urlStr.includes('/api/'))) {
      console.warn(`[AgroDex API Warning] Received 404 HTML for ${urlStr}. Check VITE_API_URL configuration.`);
    }

    return response;
  };

  console.log(`🚀 [AgroDex API] Interceptor active. Base API URL: '${getApiBaseUrl() || 'Relative / Local Proxy'}'`);
};
