import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { installGlobalFetchInterceptor } from './services/api';

// Initialize global API routing & auth interceptor
installGlobalFetchInterceptor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
