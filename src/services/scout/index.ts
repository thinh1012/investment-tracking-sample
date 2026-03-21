// [SCOUT] Module Barrel Export
// Clean imports: import { DataScoutService } from './services/scout';

export { DataScoutService, scoutService } from './ScoutOrchestrator';
export { ScoutAliasService } from './ScoutAliasService';
export type { AliasEntry, AmbiguousTokenOption, ResolutionResult } from './ScoutAliasService';

// Individual modules for direct access if needed
export * as ScoutFetcher from './ScoutFetcher';
export * as ScoutCache from './ScoutCache';
export * as ScoutTransformer from './ScoutTransformer';
export * as ScoutWatchtower from './ScoutWatchtower';

