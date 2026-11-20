import { ResearchPaper } from '../../core/models/research-paper.model';

export interface PublicationYearCount {
  year: number;
  count: number;
}

export interface PublicationYearAnalytics {
  counts: PublicationYearCount[];
  missingCount: number;
  maximumCount: number;
}

export function aggregatePublicationYears(
  papers: readonly ResearchPaper[],
): PublicationYearAnalytics {
  const counts = new Map<number, number>();
  let missingCount = 0;

  for (const paper of papers) {
    const year = paper.publishedYear;
    if (typeof year !== 'number' || !Number.isInteger(year) || year < 1800 || year > 2200) {
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
    missingCount,
    maximumCount: sortedCounts.reduce((maximum, item) => Math.max(maximum, item.count), 0),
  };
}
