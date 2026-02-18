import React, { useMemo, useState } from 'react';
import { RELEASE_NOTES } from '@/data/releaseNotes';

const MAX_RELEASES_TO_SHOW = 20;

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
    title: 'Detailed Quote Comparisons',
    description: 'Richer side-by-side supplier quote analysis with clearer decision support.'
  },
  {
    title: 'Activity Log',
    description: 'A chronological view of platform and workflow events for better traceability.'
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
  const [showFullHistory, setShowFullHistory] = useState(false);

  const sortedReleases = useMemo(
    () => [...RELEASE_NOTES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    []
  );

  const visibleReleases = showFullHistory
    ? sortedReleases
    : sortedReleases.slice(0, MAX_RELEASES_TO_SHOW);

  const hasMoreThanDefault = sortedReleases.length > MAX_RELEASES_TO_SHOW;

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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">Latest Releases</h2>
          {hasMoreThanDefault && (
            <button
              type="button"
              onClick={() => setShowFullHistory((prev) => !prev)}
              className="self-start rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              {showFullHistory ? `Show latest ${MAX_RELEASES_TO_SHOW}` : 'Show full history'}
            </button>
          )}
        </div>

        <div className="space-y-5">
          {visibleReleases.map((release) => (
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
