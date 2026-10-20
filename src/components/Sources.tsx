import { useState } from 'react';
import { useI18n } from '../i18n';
import { SOURCES, SOURCE_TOPICS, type SourceTopic } from '../lib/sources';

/** Themen mit Erklärung und anklickbaren Quellen – ganze Seite unter „Mehr“ oder aufgeklappt am Ort. */
export function SourcesList({ topics = SOURCE_TOPICS, compact = false }: { topics?: SourceTopic[]; compact?: boolean }) {
  const { lang, t } = useI18n();
  return (
    <div className={`sources ${compact ? 'sources-compact' : ''}`}>
      {topics.map((id) => {
        const s = SOURCES[id];
        return (
          <section key={id} className={compact ? 'sources-topic' : 'card section sources-topic'}>
            <h3>{s.title[lang]}</h3>
            <p>{s.text[lang]}</p>
            <ul>
              {s.refs.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener">
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!compact && <p className="search-hint sources-note">{t('sources.disclaimer')}</p>}
    </div>
  );
}

/** „Quellen“ direkt bei einer Zahl: klappt die passenden Belege an Ort und Stelle auf. */
export function SourcesLink({ topics }: { topics: SourceTopic[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="sources-link">
      <button type="button" className="btn-link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? t('sources.hide') : t('sources.show')}
      </button>
      {open && (
        <>
          <SourcesList topics={topics} compact />
          <p className="search-hint sources-note">{t('sources.disclaimer')}</p>
        </>
      )}
    </div>
  );
}
