import { GoalsView } from './GoalsView';
import { BackupSection } from './BackupSection';
import { DiagnosticsSection } from './DiagnosticsSection';

export function MoreView() {
  return (
    <div className="goals">
      <GoalsView />
      <BackupSection />
      <DiagnosticsSection />
      <p className="about">
        Ernährung · Version {__APP_VERSION__} · Daten: lokal (IndexedDB) · Produktdaten: Open Food Facts
      </p>
    </div>
  );
}
