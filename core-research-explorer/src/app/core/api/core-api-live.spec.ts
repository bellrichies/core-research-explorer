import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CORE_API_CONFIG } from '../models/core-api.config';
import { CoreApiService } from './core-api.service';

describe('CoreApiService live configuration', () => {
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
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('encodes Boolean queries and sends the bounded result count', () => {
    const service = TestBed.inject(CoreApiService);
    const http = TestBed.inject(HttpTestingController);
    service.search('drone AND (package OR delivery)', 20).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/core/works');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('drone AND (package OR delivery)');
    expect(request.request.params.get('offset')).toBe('0');
    expect(request.request.params.get('limit')).toBe('20');
    request.flush({ totalHits: 0, results: [] });
  });
});
