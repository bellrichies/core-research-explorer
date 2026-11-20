import { ResearchPaper } from '../../core/models/research-paper.model';
import { aggregatePublicationYears } from './publication-year.utils';

function paper(id: string, publishedYear: number | null): ResearchPaper {
  return {
    id,
    title: id,
    authors: [],
    abstract: null,
    publishedYear,
    doi: null,
    sourceUrl: null,
    downloadUrl: null,
    publisher: null,
  };
}

describe('aggregatePublicationYears', () => {
  it('groups and sorts valid retrieved-paper years', () => {
    const result = aggregatePublicationYears([
      paper('1', 2024),
      paper('2', 2022),
      paper('3', 2024),
    ]);

    expect(result.counts).toEqual([
      { year: 2022, count: 1 },
      { year: 2024, count: 2 },
    ]);
    expect(result.missingCount).toBe(0);
  });

  it('excludes null and implausible years', () => {
    const result = aggregatePublicationYears(
      [paper('1', null), paper('2', 1700), paper('3', 2020), paper('4', 2030)],
      2026,
    );

    expect(result.counts).toEqual([{ year: 2020, count: 1 }]);
    expect(result.includedCount).toBe(1);
    expect(result.missingCount).toBe(3);
  });

  it('excludes non-integer and non-finite years defensively', () => {
    const result = aggregatePublicationYears([
      paper('1', 2024.5),
      paper('2', Number.NaN),
      paper('3', Number.POSITIVE_INFINITY),
    ]);

    expect(result.counts).toEqual([]);
    expect(result.includedCount).toBe(0);
    expect(result.missingCount).toBe(3);
  });

  it('returns empty analytics for no papers', () => {
    expect(aggregatePublicationYears([])).toEqual({
      counts: [],
      includedCount: 0,
      missingCount: 0,
    });
  });
});
