import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AmbientShell } from '@/components/layout';
import { CommandBar } from '@/features/command-bar';
import {
  DealsKanbanView,
  DealDetailView,
  DealForm,
} from '@/features/deals';
import { useKeyboardShortcuts } from '@/hooks';
import type { Deal } from '@/types';

export function DealsPage() {
  useKeyboardShortcuts();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlDealId } = useParams<{ id?: string }>();

  // Check if we're on /deals/new
  const isNewRoute = location.pathname === '/deals/new';

  // Selected deal for detail view
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    urlDealId && urlDealId !== 'new' ? urlDealId : null
  );

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(isNewRoute);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  // Sync URL parameter with state
  useEffect(() => {
    if (urlDealId && urlDealId !== 'new') {
      setSelectedDealId(urlDealId);
    } else {
      setSelectedDealId(null);
    }
  }, [urlDealId]);

  // Open form when navigating to /deals/new
  useEffect(() => {
    if (isNewRoute) {
      setIsFormOpen(true);
      setEditingDeal(undefined);
    }
  }, [isNewRoute]);

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    navigate(`/deals/${deal.id}`, { replace: true });
  };

  const handleCloseDetail = () => {
    setSelectedDealId(null);
    navigate('/deals', { replace: true });
  };

  const handleCreateDeal = (stageId?: string) => {
    setEditingDeal(undefined);
    setDefaultStageId(stageId);
    setIsFormOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setDefaultStageId(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDeal(undefined);
    setDefaultStageId(undefined);
    // Navigate back to /deals if we were on /deals/new
    if (isNewRoute) {
      navigate('/deals', { replace: true });
    }
  };

  return (
    <>
      <AmbientShell showZoomControls={false} showBackButton>
        <DealsKanbanView
          onSelectDeal={handleSelectDeal}
          onCreateDeal={handleCreateDeal}
        />
      </AmbientShell>

      {/* Detail slide-over */}
      <DealDetailView
        dealId={selectedDealId}
        onClose={handleCloseDetail}
        onEdit={handleEditDeal}
      />

      {/* Create/Edit modal */}
      <DealForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        deal={editingDeal}
        defaultStageId={defaultStageId}
      />

      {/* Command Bar */}
      <CommandBar />
    </>
  );
}
