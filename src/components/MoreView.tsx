import { GoalsView } from './GoalsView';
import { BackupSection } from './BackupSection';

export function MoreView() {
  return (
    <div className="goals">
      <GoalsView />
      <BackupSection />
      <p className="about">
        Ernährung · Version {__APP_VERSION__} · Daten: lokal (IndexedDB) · Produktdaten: Open Food Facts
      </p>
    </div>
  );
}
