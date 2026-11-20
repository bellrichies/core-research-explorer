import { InjectionToken } from '@angular/core';

export interface CoreApiConfig {
  coreBaseUrl: string;
}

export const CORE_API_CONFIG = new InjectionToken<CoreApiConfig>('CORE_API_CONFIG');
