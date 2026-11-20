import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subject, Subscription, catchError, map, of, switchMap } from 'rxjs';
import { CoreApiService } from '../../core/api/core-api.service';
import { ResearchSearchResult } from '../../core/models/research-paper.model';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

@Injectable()
export class ResearchStore implements OnDestroy {
  readonly status = signal<SearchStatus>('idle');
  readonly result = signal<ResearchSearchResult | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isEmpty = computed(() => this.status() === 'empty');
  readonly isError = computed(() => this.status() === 'error');

  private readonly searches = new Subject<{ query: string; limit: number }>();
  private readonly coreApi = inject(CoreApiService);
  private readonly searchSubscription: Subscription = this.searches
    .pipe(
      switchMap(({ query, limit }) =>
        this.coreApi.search(query, limit).pipe(
          map((result) => ({ kind: 'success' as const, result })),
          catchError((error: unknown) =>
            of({ kind: 'error' as const, error: this.toErrorMessage(error) }),
          ),
        ),
      ),
    )
    .subscribe((outcome) => {
      if (outcome.kind === 'error') {
        this.result.set(null);
        this.errorMessage.set(outcome.error);
        this.status.set('error');
      } else {
        this.errorMessage.set(null);
        this.result.set(outcome.result);
        this.status.set(outcome.result.papers.length ? 'success' : 'empty');
      }
    });

  search(query: string, limit: number): void {
    this.errorMessage.set(null);
    this.status.set('loading');
    this.searches.next({ query, limit });
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  private toErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'CORE search could not be completed. Please try again.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'CORE rejected the request. Live search credentials or authorization are not available.';
    }
    if (error.status === 429) {
      return 'CORE is rate-limiting requests. Wait briefly, then retry.';
    }
    if (
      error.status === 503 &&
      typeof error.error === 'object' &&
      error.error !== null &&
      'code' in error.error &&
      error.error.code === 'CORE_API_KEY_MISSING'
    ) {
      return 'Live CORE search is not configured. Add CORE_API_KEY to the server environment.';
    }
    if (error.status >= 500) {
      return 'CORE is temporarily unavailable. Please retry.';
    }
    if (error.status === 0) {
      return 'The network or CORE CORS policy prevented this request.';
    }
    return 'CORE search failed. Please check the query and retry.';
  }
}
