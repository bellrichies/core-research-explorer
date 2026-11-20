export interface ResearchPaper {
  id: string | null;
  title: string | null;
  authors: string[];
  abstract: string | null;
  publishedYear: number | null;
  doi: string | null;
  sourceUrl: string | null;
  downloadUrl: string | null;
  publisher: string | null;
}

export interface ResearchSearchResult {
  papers: ResearchPaper[];
  totalHits: number | null;
  retrievedCount: number;
  query: string;
}
