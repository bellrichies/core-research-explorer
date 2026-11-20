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
            coreBaseUrl: '/api/core/works',
          },
        },
      ],
    });
    service = TestBed.inject(CoreApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps a CORE API response', () => {
    let result: ResearchSearchResult | undefined;

    service.search('drone AND (package OR delivery)', 10).subscribe((value) => {
      result = value;
    });

    const request = http.expectOne((candidate) => candidate.url === '/api/core/works');
    expect(request.request.method).toBe('GET');
    request.flush({
      totalHits: 1,
      limit: 1,
      offset: 0,
      results: [
        {
          id: 123456,
          title: 'Autonomous delivery systems',
          authors: [{ name: 'Research Author' }],
          abstract: null,
          yearPublished: 2024,
          doi: null,
          downloadUrl: 'https://core.ac.uk/download/123456.pdf',
          publisher: null,
          links: [{ type: 'display', url: 'https://core.ac.uk/works/123456' }],
          sourceFulltextUrls: ['https://repository.example/research.pdf'],
        },
      ],
    });

    expect(result!.papers[0]).toMatchObject({
      id: '123456',
      title: 'Autonomous delivery systems',
      authors: ['Research Author'],
      abstract: null,
      publishedYear: 2024,
      sourceUrl: 'https://core.ac.uk/works/123456',
      downloadUrl: 'https://core.ac.uk/download/123456.pdf',
    });
    expect(result!.totalHits).toBe(1);
    expect(result!.query).toBe('drone AND (package OR delivery)');
  });

  it('bounds requested result counts', () => {
    let capturedCount = 0;
    service.search('drone', 500).subscribe((result) => {
      capturedCount = result.retrievedCount;
    });
    http
      .expectOne((candidate) => candidate.url === '/api/core/works')
      .flush({
        totalHits: 0,
        results: [],
      });
    expect(capturedCount).toBe(0);
  });

  it('maps missing and malformed paper fields without crashing', () => {
    let result: ResearchSearchResult | undefined;
    service.search('missing fields', 20).subscribe((value) => (result = value));

    http
      .expectOne((candidate) => candidate.url === '/api/core/works')
      .flush({
        totalHits: 'unknown',
        results: [
          {
            id: null,
            title: null,
            authors: ['Valid Author', 42, null],
            abstract: null,
            yearPublished: 'not-a-year',
            doi: null,
            links: [],
          },
        ],
      });

    expect(result!.totalHits).toBeNull();
    expect(result!.papers[0]).toEqual({
      id: null,
      title: null,
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
