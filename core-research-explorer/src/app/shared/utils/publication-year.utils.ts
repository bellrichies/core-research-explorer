import { ResearchPaper } from '../../core/models/research-paper.model';

export interface PublicationYearCount {
  year: number;
  count: number;
}

export interface PublicationYearAnalytics {
  counts: PublicationYearCount[];
  includedCount: number;
  missingCount: number;
}

const EARLIEST_PLAUSIBLE_PUBLICATION_YEAR = 1800;

export function aggregatePublicationYears(
  papers: readonly ResearchPaper[],
  maximumYear = new Date().getUTCFullYear() + 1,
): PublicationYearAnalytics {
  const counts = new Map<number, number>();
  let missingCount = 0;

  for (const paper of papers) {
    const year = paper.publishedYear;
    if (
      typeof year !== 'number' ||
      !Number.isInteger(year) ||
      year < EARLIEST_PLAUSIBLE_PUBLICATION_YEAR ||
      year > maximumYear
    ) {
      missingCount++;
      continue;
    }
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  const sortedCounts = [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((left, right) => left.year - right.year);

  return {
    counts: sortedCounts,
    includedCount: papers.length - missingCount,
    missingCount,
  };
}
