import React from 'react';
import { RELEASE_NOTES } from '@/data/releaseNotes';

const formatReleaseDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const upcomingItems = [
  {
    title: 'Public Product Roadmap',
    description: 'A high-level roadmap to preview upcoming platform milestones.'
  },
  {
    title: 'Release Filtering',
    description: 'Filter updates by area such as projects, assets, quotes, and suppliers.'
  },
  {
    title: 'In-App Release Notifications',
    description: 'Highlight major product updates directly in the dashboard experience.'
  }
];

const ReleaseNotesPage: React.FC = () => {
  const latestFiveReleases = RELEASE_NOTES.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Release Notes</h1>
        <p className="mt-2 text-sm sm:text-base text-white/80 max-w-3xl">
          Track the latest updates across ProdBay. This page highlights recently shipped changes and
          what is coming next.
        </p>
      </section>

      <section className="rounded-xl border border-white/20 bg-black/20 backdrop-blur-md p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">Last 5 Releases</h2>

        <div className="space-y-5">
          {latestFiveReleases.map((release) => (
            <article
              key={`${release.version}-${release.date}`}
              className="rounded-lg border border-white/20 bg-white/5 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm font-medium text-teal-300">{release.version}</p>
                <p className="text-xs text-white/70">{formatReleaseDate(release.date)}</p>
              </div>

              <h3 className="mt-2 text-lg font-semibold text-white">{release.title}</h3>

              <ul className="mt-3 list-disc list-inside space-y-1.5 text-sm text-white/85">
                {release.bulletPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-white/30 bg-white/5 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingItems.map((item) => (
            <div key={item.title} className="rounded-lg border border-white/20 bg-black/20 p-4">
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm text-white/75">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReleaseNotesPage;
