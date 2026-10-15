import type { ReactNode } from 'react';
import { useT } from '../i18n';
import { dismissTip, useTip, type TipId } from '../lib/tips';

/** Einmaliger Hinweis, eine Zeile, mit einem Tipp weg. `when` begrenzt auf den passenden Moment. */
export function Tip({ id, when = true, children }: { id: TipId; when?: boolean; children: ReactNode }) {
  const t = useT();
  const show = useTip(id);
  if (!show || !when) return null;
  return (
    <div className="tip" role="note">
      <p>{children}</p>
      <button type="button" className="btn-icon tip-close" onClick={() => dismissTip(id)} aria-label={t('tip.dismiss')}>
        ×
      </button>
    </div>
  );
}
