import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../lib/errorLog';
import { t } from '../i18n';

interface State {
  error: Error | null;
}

/** Fängt Render-Fehler ab, damit die App nicht als leere Seite hängen bleibt. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    window.__hideSplash?.();
    console.error('Unerwarteter Fehler', error, info.componentStack);
    logError('react', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app">
        <section className="card section" role="alert" style={{ marginTop: 24 }}>
          <h2>{t('error.title')}</h2>
          <p className="search-hint" style={{ margin: '8px 0 12px' }}>
            {this.state.error.message}
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            {t('error.reload')}
          </button>
        </section>
      </div>
    );
  }
}
