import { InjectionToken } from '@angular/core';

export interface CoreApiConfig {
  mode: 'fixture' | 'core';
  coreBaseUrl: string;
  fixtureUrl: string;
}

export const CORE_API_CONFIG = new InjectionToken<CoreApiConfig>('CORE_API_CONFIG');
