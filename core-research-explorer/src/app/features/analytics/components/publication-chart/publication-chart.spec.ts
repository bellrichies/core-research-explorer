import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicationYearAnalytics } from '../../../../shared/utils/publication-year.utils';
import { PublicationChart } from './publication-chart';

describe('PublicationChart', () => {
  let fixture: ComponentFixture<PublicationChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PublicationChart] }).compileComponents();
    fixture = TestBed.createComponent(PublicationChart);
  });

  function render(analytics: PublicationYearAnalytics, retrievedCount = 3): HTMLElement {
    fixture.componentRef.setInput('analytics', analytics);
    fixture.componentRef.setInput('retrievedCount', retrievedCount);
    fixture.componentRef.setInput('query', 'drone AND delivery');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('labels the retrieved-data scope and exposes exact values in a table', () => {
    const element = render({
      counts: [{ year: 2024, count: 2 }],
      includedCount: 2,
      missingCount: 1,
    });

    expect(element.querySelector('.scope-note')?.textContent).toContain('3 retrieved papers');
    expect(element.querySelector('.scope-note')?.textContent).toContain('not all matching papers');
    expect(element.querySelector('table')?.textContent).toContain('2024');
    expect(element.querySelector('.exclusion-note')?.textContent).toContain('1 paper(s) excluded');
  });

  it('renders an informative empty state when every retrieved year is missing', () => {
    const element = render({ counts: [], includedCount: 0, missingCount: 3 }, 3);

    expect(element.querySelector('.chart-empty')?.textContent).toContain(
      'None of the 3 retrieved paper(s)',
    );
    expect(element.querySelector('.year-chart')).toBeNull();
  });

  it('creates a synchronized chart host when valid years arrive after an empty result', () => {
    const element = render({ counts: [], includedCount: 0, missingCount: 2 }, 2);
    expect(element.querySelector('.chart-empty')).toBeTruthy();

    fixture.componentRef.setInput('analytics', {
      counts: [
        { year: 2023, count: 1 },
        { year: 2024, count: 2 },
      ],
      includedCount: 3,
      missingCount: 0,
    });
    fixture.componentRef.setInput('retrievedCount', 3);
    fixture.detectChanges();

    expect(element.querySelector('.year-chart')).toBeTruthy();
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(element.querySelector('table')?.textContent).toContain('2024');
  });
});
