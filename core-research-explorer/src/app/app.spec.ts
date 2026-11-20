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
            mode: 'fixture',
            coreBaseUrl: 'https://api.core.ac.uk/v3/search/works',
            fixtureUrl: '/core-search-fixture.json',
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
    expect(compiled.querySelector('#query')).toBeTruthy();
    expect(compiled.querySelectorAll('#limit option').length).toBe(3);
  });

  it('renders retrieved-paper scope and aggregated years', async () => {
    const fixture = TestBed.createComponent(App);
    const store = fixture.debugElement.injector.get(ResearchStore);
    const http = TestBed.inject(HttpTestingController);

    store.search('drone', 10);
    http.expectOne('/core-search-fixture.json').flush({
      total_hits: 20,
      results: [
        { id: 1, title: 'One', year_published: 2024 },
        { id: 2, title: 'Two', year_published: 2022 },
        { id: 3, title: 'Three', year_published: 2024 },
        { id: 4, title: 'Four', year_published: null },
      ],
    });

    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.scope-note')?.textContent).toContain('4 retrieved papers');
    expect(compiled.querySelectorAll('.year-bar-group').length).toBe(2);
    expect(compiled.querySelector('.chart-summary')?.textContent).toContain('1 paper(s)');
  });
});
