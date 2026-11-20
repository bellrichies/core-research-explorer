import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CORE_API_CONFIG } from '../../core/models/core-api.config';
import { ResearchStore } from './research.store';

describe('ResearchStore', () => {
  let store: ResearchStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ResearchStore,
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
    store = TestBed.inject(ResearchStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancels the stale HTTP search when a newer search starts', () => {
    store.search('first query', 10);
    const first = http.expectOne('/core-search-fixture.json');
    store.search('newest query', 20);
    const second = http.expectOne('/core-search-fixture.json');

    expect(first.cancelled).toBe(true);
    second.flush({
      total_hits: 1,
      results: [{ id: 1, title: 'Newest result', year_published: 2025 }],
    });

    expect(store.result()?.query).toBe('newest query');
    expect(store.result()?.retrievedCount).toBe(1);
  });

  it.each([
    [401, 'credentials or authorization'],
    [403, 'credentials or authorization'],
    [429, 'rate-limiting'],
    [500, 'temporarily unavailable'],
    [0, 'network or CORE CORS'],
  ])('maps HTTP %i to a clear error', (status, messagePart) => {
    store.search('drone', 10);
    http
      .expectOne('/core-search-fixture.json')
      .flush({}, { status: status as number, statusText: 'Error' });

    expect(store.isError()).toBe(true);
    expect(store.errorMessage()).toContain(messagePart);
  });

  it('ignores cancellation as stale work rather than displaying an error', () => {
    store.search('old', 10);
    const oldRequest = http.expectOne('/core-search-fixture.json');
    store.search('new', 10);
    http.expectOne('/core-search-fixture.json').flush({ total_hits: 0, results: [] });

    expect(oldRequest.cancelled).toBe(true);
    expect(store.isEmpty()).toBe(true);
  });
});
