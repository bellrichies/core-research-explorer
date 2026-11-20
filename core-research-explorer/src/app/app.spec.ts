import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { CORE_API_CONFIG } from './core/models/core-api.config';
import { ResearchStore } from './features/research-search/research.store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: CORE_API_CONFIG,
          useValue: {
            coreBaseUrl: '/api/core/works',
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('CORE Research Explorer');
  });

  it('renders the search form and result-count choices', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect((compiled.querySelector('#query') as HTMLInputElement).value).toBe('');
    expect(compiled.querySelectorAll('#limit option').length).toBe(3);
  });

  it('renders retrieved-paper scope and aggregated years', async () => {
    const fixture = TestBed.createComponent(App);
    const store = fixture.debugElement.injector.get(ResearchStore);
    const http = TestBed.inject(HttpTestingController);

    store.search('drone', 10);
    http
      .expectOne((request) => request.url === '/api/core/works')
      .flush({
        totalHits: 20,
        results: [
          { id: 1, title: 'One', yearPublished: 2024 },
          { id: 2, title: 'Two', yearPublished: 2022 },
          { id: 3, title: 'Three', yearPublished: 2024 },
          { id: 4, title: 'Four', yearPublished: null },
        ],
      });

    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.scope-note')?.textContent).toContain('4 retrieved papers');
    expect(compiled.querySelectorAll('table tbody tr').length).toBe(2);
    expect(compiled.querySelector('.exclusion-note')?.textContent).toContain('1 paper(s)');
  });

  it('shows loading then an empty state', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const store = fixture.debugElement.injector.get(ResearchStore);
    const http = TestBed.inject(HttpTestingController);

    store.search('unknown topic', 20);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.status')?.textContent).toContain(
      'Searching CORE',
    );

    http
      .expectOne((request) => request.url === '/api/core/works')
      .flush({ totalHits: 0, results: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.state h3')?.textContent,
    ).toContain('No papers found');
  });

  it('omits missing metadata instead of rendering invented values', async () => {
    const fixture = TestBed.createComponent(App);
    const store = fixture.debugElement.injector.get(ResearchStore);
    const http = TestBed.inject(HttpTestingController);

    store.search('incomplete metadata', 10);
    http
      .expectOne((request) => request.url === '/api/core/works')
      .flush({
        totalHits: 1,
        results: [{ id: null, title: null, authors: null, abstract: null }],
      });

    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.paper-card')).toBeNull();
    expect(compiled.querySelector('.state h3')?.textContent).toContain('No papers found');
  });

  it('shows a clear error and retry control', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const store = fixture.debugElement.injector.get(ResearchStore);
    const http = TestBed.inject(HttpTestingController);

    store.search('drone', 10);
    http
      .expectOne((request) => request.url === '/api/core/works')
      .flush({ message: 'rate limited' }, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-state')?.textContent).toContain('rate-limiting requests');
    expect(compiled.querySelector('.error-state button')?.textContent).toContain('Retry');
  });

  it('submits through the form with Enter', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const query = compiled.querySelector('#query') as HTMLInputElement;
    query.value = 'robots AND delivery';
    query.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = compiled.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url === '/api/core/works')
      .flush({
        totalHits: 1,
        results: [{ id: 1, title: 'Keyboard result', yearPublished: 2024 }],
      });
  });
});
