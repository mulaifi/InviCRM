export { AIClient, type AIClientConfig } from './client';
export { EntityExtractor, type ExtractedEntities } from './extractors/entity-extractor';
export { NaturalLanguageParser, type ParsedQuery } from './parsers/natural-language';
export { SentimentAnalyzer, type SentimentResult } from './analyzers/sentiment';
export {
  DuplicateDetector,
  type ContactForDuplication,
  type DuplicateMatch,
  type DuplicateAnalysisResult,
} from './analyzers/duplicate-detector';
