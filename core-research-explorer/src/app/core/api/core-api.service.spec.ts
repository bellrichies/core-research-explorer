import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CORE_API_CONFIG } from '../models/core-api.config';
import { ResearchSearchResult } from '../models/research-paper.model';
import { CoreApiService } from './core-api.service';

describe('CoreApiService', () => {
  let service: CoreApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CoreApiService,
        {
          provide: CORE_API_CONFIG,
          useValue: {
            mode: 'fixture',
            coreBaseUrl: 'https://api.core.ac.uk/v3/search/works',
            fixtureUrl: '/core-search-fixture.json',
          },
        },
      ],
    });
    service = TestBed.inject(CoreApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and maps the sanitized fixture', () => {
    let result: ResearchSearchResult | undefined;

    service.search('drone AND (package OR delivery)', 10).subscribe((value) => {
      result = value;
    });

    const request = http.expectOne('/core-search-fixture.json');
    expect(request.request.method).toBe('GET');
    request.flush({
      total_hits: 1,
      limit: 1,
      offset: 0,
      results: [
        {
          id: 123456,
          title: 'Sanitized fixture title',
          authors: ['Example Author'],
          abstract: null,
          year_published: 2024,
          doi: null,
          download_url: null,
          publisher: null,
          links: [],
          source_fulltext_urls: [],
        },
      ],
    });

    expect(result!.papers[0]).toMatchObject({
      id: '123456',
      title: 'Sanitized fixture title',
      authors: ['Example Author'],
      abstract: null,
      publishedYear: 2024,
    });
    expect(result!.query).toBe('drone AND (package OR delivery)');
  });

  it('bounds requested result counts', () => {
    let capturedCount = 0;
    service.search('drone', 500).subscribe((result) => {
      capturedCount = result.retrievedCount;
    });
    http.expectOne('/core-search-fixture.json').flush({
      total_hits: 0,
      results: [],
    });
    expect(capturedCount).toBe(0);
  });

  it('maps missing and malformed paper fields without crashing', () => {
    let result: ResearchSearchResult | undefined;
    service.search('missing fields', 20).subscribe((value) => (result = value));

    http.expectOne('/core-search-fixture.json').flush({
      total_hits: 'unknown',
      results: [
        {
          id: null,
          title: null,
          authors: ['Valid Author', 42, null],
          abstract: null,
          year_published: 'not-a-year',
          doi: null,
          links: [],
        },
      ],
    });

    expect(result!.totalHits).toBeNull();
    expect(result!.papers[0]).toEqual({
      id: 'paper-1',
      title: 'Untitled research paper',
      authors: ['Valid Author'],
      abstract: null,
      publishedYear: null,
      doi: null,
      sourceUrl: null,
      downloadUrl: null,
      publisher: null,
    });
  });
});
