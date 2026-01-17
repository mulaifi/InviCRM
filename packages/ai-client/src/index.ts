export { AIClient, type AIClientConfig, type AIProvider } from './client';
export { EntityExtractor, type ExtractedEntities } from './extractors/entity-extractor';
export { NaturalLanguageParser, type ParsedQuery } from './parsers/natural-language';
export { SentimentAnalyzer, type SentimentResult } from './analyzers/sentiment';
export {
  DuplicateDetector,
  type ContactForDuplication,
  type DuplicateMatch,
  type DuplicateAnalysisResult,
} from './analyzers/duplicate-detector';
export {
  MorningBriefingGenerator,
  type BriefingInput,
  type MorningBriefing,
  type Meeting,
  type DealSummary,
  type RecentActivity,
} from './generators/morning-briefing';
