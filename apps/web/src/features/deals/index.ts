// Components
export { KanbanBoard, type KanbanBoardProps } from './KanbanBoard';
export { KanbanColumn, type KanbanColumnProps } from './KanbanColumn';
export { DealCard, DealCardOverlay, type DealCardProps } from './DealCard';
export { ColumnHeader, type ColumnHeaderProps } from './ColumnHeader';
export { DealsKanbanView, type DealsKanbanViewProps } from './DealsKanbanView';
export { DealDetailView, type DealDetailViewProps } from './DealDetailView';
export { DealForm, type DealFormProps } from './DealForm';
export { PipelineSelector, type PipelineSelectorProps } from './PipelineSelector';
export { DealsEmptyState, type DealsEmptyStateProps } from './DealsEmptyState';

// Hooks
export {
  useDealsList,
  useDeal,
  usePipelines,
  usePipeline,
  usePipelineStages,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useMoveDealToStage,
  dealsKeys,
  pipelinesKeys,
} from './useDeals';
