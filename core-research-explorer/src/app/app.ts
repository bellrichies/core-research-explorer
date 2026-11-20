import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ResearchStore } from './features/research-search/research.store';
import { validateBooleanQuery } from './shared/utils/boolean-query.utils';
import { aggregatePublicationYears } from './shared/utils/publication-year.utils';
import { PublicationChart } from './features/analytics/components/publication-chart/publication-chart';

@Component({
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  imports: [ReactiveFormsModule, PublicationChart],
  providers: [ResearchStore],
})
export class App {
  protected readonly title = signal('CORE Research Explorer');
  protected readonly store = inject(ResearchStore);
  protected readonly resultCounts = [10, 20, 50];
  protected readonly searchForm = new FormGroup({
    query: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    limit: new FormControl(10, { nonNullable: true, validators: [Validators.required] }),
  });
  protected validationMessage = signal<string | null>(null);
  protected readonly publicationAnalytics = computed(() =>
    aggregatePublicationYears(this.store.result()?.papers ?? []),
  );

  protected submitSearch(): void {
    const query = this.searchForm.controls.query.value;
    const validation = validateBooleanQuery(query);
    this.validationMessage.set(validation.message);
    if (!validation.valid) return;

    this.store.search(query.trim(), this.searchForm.controls.limit.value);
  }

  protected retry(): void {
    this.submitSearch();
  }
}
