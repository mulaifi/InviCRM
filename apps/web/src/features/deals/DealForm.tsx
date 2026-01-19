import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useCreateDeal, useUpdateDeal, usePipelineStages } from './useDeals';
import { useContactsList, useCompaniesList } from '@/features/contacts';
import type { Deal } from '@/types';
import type { SelectOption } from '@/components/ui';
import { getDealAmountAsNumber } from '@/types';

export interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: Deal;
  defaultStageId?: string;
}

interface FormData {
  name: string;
  amount: string;
  currency: string;
  stageId: string;
  companyId: string;
  contactId: string;
  expectedCloseDate: string;
  probability: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  amount?: string;
  stageId?: string;
}

const currencyOptions: SelectOption[] = [
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'USD', label: 'USD - US Dollar' },
];

export function DealForm({
  isOpen,
  onClose,
  deal,
  defaultStageId,
}: DealFormProps) {
  const isEditing = !!deal;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    amount: '',
    currency: 'KWD',
    stageId: '',
    companyId: '',
    contactId: '',
    expectedCloseDate: '',
    probability: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const { data: stagesData } = usePipelineStages();
  const { data: companiesData } = useCompaniesList({ pageSize: 100 });
  const { data: contactsData } = useContactsList({
    companyId: formData.companyId || undefined,
    pageSize: 100,
  });

  const stages = stagesData || [];
  const companies = companiesData?.data || [];
  const contacts = contactsData?.data || [];

  const isSubmitting = createDeal.isPending || updateDeal.isPending;

  // Reset form when modal opens or deal changes
  useEffect(() => {
    if (isOpen) {
      if (deal) {
        const closeDate = deal.expectedCloseDate?.split('T')[0] ?? '';
        setFormData({
          name: deal.name,
          amount: getDealAmountAsNumber(deal).toString(),
          currency: deal.currency ?? 'KWD',
          stageId: deal.stageId,
          companyId: deal.companyId ?? '',
          contactId: deal.contactId ?? '',
          expectedCloseDate: closeDate,
          probability: deal.probability?.toString() ?? '',
          notes: deal.notes ?? '',
        });
      } else {
        // Set defaults for new deal
        const sortedStages = [...stages].sort((a, b) => a.position - b.position);
        let defaultStage = sortedStages[0];
        if (defaultStageId) {
          const foundStage = stages.find((s) => s.id === defaultStageId);
          if (foundStage) {
            defaultStage = foundStage;
          }
        }

        setFormData({
          name: '',
          amount: '',
          currency: 'KWD',
          stageId: defaultStage?.id || '',
          companyId: '',
          contactId: '',
          expectedCloseDate: '',
          probability: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, deal, stages, defaultStageId]);

  // Clear contact when company changes (contacts are filtered by company)
  useEffect(() => {
    if (!isEditing && formData.companyId) {
      // If the selected contact doesn't belong to the new company, clear it
      const contactBelongsToCompany = contacts.some(
        (c) => c.id === formData.contactId
      );
      if (!contactBelongsToCompany && formData.contactId) {
        setFormData((prev) => ({ ...prev, contactId: '' }));
      }
    }
  }, [formData.companyId, contacts, formData.contactId, isEditing]);

  // Build options
  const stageOptions: SelectOption[] = [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({
      value: stage.id,
      label: stage.name,
    }));

  const companyOptions: SelectOption[] = [
    { value: '', label: 'Select a company (optional)' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  const contactOptions: SelectOption[] = [
    { value: '', label: 'Select a contact (optional)' },
    ...contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName || ''}`.trim(),
    })),
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Deal name is required';
    }

    if (!formData.stageId) {
      newErrors.stageId = 'Stage is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const data = {
        name: formData.name.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        currency: formData.currency,
        stageId: formData.stageId,
        companyId: formData.companyId || undefined,
        contactId: formData.contactId || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        probability: formData.probability ? parseInt(formData.probability, 10) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (isEditing && deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          data: {
            name: data.name,
            amount: data.amount,
            stageId: data.stageId,
            companyId: data.companyId || null,
            contactId: data.contactId || null,
            expectedCloseDate: data.expectedCloseDate || null,
            probability: data.probability,
            notes: data.notes || null,
          },
        });
      } else {
        // For create, we need to include pipelineId
        const defaultPipelineId = stages[0]?.pipelineId;
        if (!defaultPipelineId) {
          console.error('No pipeline available');
          return;
        }
        await createDeal.mutateAsync({
          ...data,
          pipelineId: defaultPipelineId,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save deal:', error);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Deal' : 'New Deal'}
      description={
        isEditing
          ? 'Update the deal information below.'
          : 'Add a new deal to your pipeline.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          id="name"
          label="Deal Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enterprise License Deal"
          autoFocus
        />

        {/* Company */}
        <Select
          label="Company"
          value={formData.companyId}
          onChange={(value) => handleChange('companyId', value)}
          options={companyOptions}
          placeholder="Select a company"
        />

        {/* Contact (filtered by company) */}
        <Select
          label="Contact"
          value={formData.contactId}
          onChange={(value) => handleChange('contactId', value)}
          options={contactOptions}
          placeholder="Link to a contact"
        />

        {/* Amount and Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              id="amount"
              type="number"
              label="Amount"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              error={errors.amount}
              placeholder="25000"
              min="0"
              step="100"
            />
          </div>
          <Select
            label="Currency"
            value={formData.currency}
            onChange={(value) => handleChange('currency', value)}
            options={currencyOptions}
          />
        </div>

        {/* Stage and Probability */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Stage"
            value={formData.stageId}
            onChange={(value) => handleChange('stageId', value)}
            options={stageOptions}
            error={errors.stageId}
            placeholder="Select stage"
          />
          <Input
            id="probability"
            type="number"
            label="Probability %"
            value={formData.probability}
            onChange={(e) => handleChange('probability', e.target.value)}
            placeholder="50"
            min="0"
            max="100"
          />
        </div>

        {/* Expected Close Date */}
        <Input
          id="expectedCloseDate"
          type="date"
          label="Expected Close Date"
          value={formData.expectedCloseDate}
          onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
        />

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Deal notes and details..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-bg-tertiary bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
