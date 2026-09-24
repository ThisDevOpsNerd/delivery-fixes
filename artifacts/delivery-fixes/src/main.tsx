import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
    };
  }
}

setAuthTokenGetter(async () => {
  if (!window.shopify?.idToken) return null;
  try {
    return await window.shopify.idToken();
  } catch {
    return null;
  }
});

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
