import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CORE_API_CONFIG, CoreApiConfig } from '../models/core-api.config';
import { ResearchPaper, ResearchSearchResult } from '../models/research-paper.model';

@Injectable({ providedIn: 'root' })
export class CoreApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<CoreApiConfig>(CORE_API_CONFIG);

  search(query: string, limit: number): Observable<ResearchSearchResult> {
    const safeLimit = this.boundLimit(limit);

    if (this.config.mode === 'fixture') {
      return this.http
        .get<unknown>(this.config.fixtureUrl)
        .pipe(map((payload) => this.mapResponse(payload, query, safeLimit)));
    }

    const params = new HttpParams()
      .set('q', query)
      .set('offset', '0')
      .set('limit', String(safeLimit));

    return this.http
      .get<unknown>(this.config.coreBaseUrl, { params })
      .pipe(map((payload) => this.mapResponse(payload, query, safeLimit)));
  }

  private boundLimit(limit: number): number {
    if (!Number.isFinite(limit)) return 10;
    return Math.min(50, Math.max(1, Math.floor(limit)));
  }

  private mapResponse(payload: unknown, query: string, limit: number): ResearchSearchResult {
    const record = this.asRecord(payload);
    const rawResults = Array.isArray(record?.['results']) ? record['results'] : [];
    const totalHits = this.asFiniteNumber(record?.['total_hits']);
    const papers = rawResults.map((item, index) => this.mapPaper(item, index)).slice(0, limit);

    return {
      papers,
      totalHits,
      retrievedCount: papers.length,
      query,
    };
  }

  private mapPaper(value: unknown, index: number): ResearchPaper {
    const record = this.asRecord(value) ?? {};
    const authors = Array.isArray(record['authors'])
      ? record['authors'].filter((author): author is string => typeof author === 'string')
      : [];
    const links = Array.isArray(record['links'])
      ? record['links'].map((link) => this.asRecord(link)).filter((link) => link !== null)
      : [];
    const sourceUrl = this.firstString([
      record['sourceUrl'],
      record['source_url'],
      ...links.map((link) => link['url']),
      ...this.asStringArray(record['source_fulltext_urls']),
    ]);
    const doi = this.firstString([record['doi']]);
    const downloadUrl = this.firstString([
      record['downloadUrl'],
      record['download_url'],
      ...this.asStringArray(record['source_fulltext_urls']),
    ]);
    const publisher = this.firstString([record['publisher'], record['publisher_name']]);

    const rawId = record['id'];
    const id =
      typeof rawId === 'string' && rawId.trim()
        ? rawId.trim()
        : typeof rawId === 'number'
          ? String(rawId)
          : `paper-${index + 1}`;

    return {
      id,
      title: this.firstString([record['title']]) ?? 'Untitled research paper',
      authors,
      abstract: this.firstString([record['abstract'], record['description']]),
      publishedYear: this.asPublishedYear(record['year_published']),
      doi,
      sourceUrl,
      downloadUrl,
      publisher,
    };
  }

  private asPublishedYear(value: unknown): number | null {
    const year = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(year) && year >= 1800 && year <= 2200 ? year : null;
  }

  private asFiniteNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private firstString(values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }
}
