import React from 'react';
import ActiveProjectsGrid from './ActiveProjectsGrid';

/**
 * AllProjectsPage - Comprehensive view of all projects
 * 
 * This is a simple wrapper component that renders the ActiveProjectsGrid
 * without statistics and without project limits, providing a full list view
 * optimized for browsing and discovery.
 * 
 * Features:
 * - Shows all active projects (no limit)
 * - Shows all archived projects (no limit)
 * - Hides summary statistics (focus on browsing)
 * - Foundation for future search/filter features
 */
const AllProjectsPage: React.FC = () => {
  return (
    <ActiveProjectsGrid 
      showStats={false}
      // projectLimit is undefined, so all projects will be displayed
    />
  );
};

export default AllProjectsPage;

