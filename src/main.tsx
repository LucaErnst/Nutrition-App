import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installErrorLogging } from './lib/errorLog';
import { I18nProvider } from './i18n';

installErrorLogging();
import { seedIfEmpty } from './db/seed';

void seedIfEmpty();

// Safari darf lokale Daten sonst nach längerer Nichtnutzung löschen.
if (navigator.storage?.persist) void navigator.storage.persist();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
);
