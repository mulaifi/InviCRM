import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useCreateDeal, useUpdateDeal, usePipelineStages } from './useDeals';
import { useContactsList, useCustomersList } from '@/features/contacts';
import type { Deal } from '@/types';
import type { SelectOption } from '@/components/ui';
import { getDealValueAsNumber } from '@/types';

export interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: Deal;
  defaultStageId?: string;
}

interface FormData {
  name: string;
  value: string;
  currency: string;
  stageId: string;
  customerId: string;
  primaryContactId: string;
  expectedCloseDate: string;
  temperature: string;
  description: string;
}

interface FormErrors {
  name?: string;
  value?: string;
  stageId?: string;
  customerId?: string;
}

const currencyOptions: SelectOption[] = [
  { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'USD', label: 'USD - US Dollar' },
];

const temperatureOptions: SelectOption[] = [
  { value: '', label: 'Not set' },
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
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
    value: '',
    currency: 'KWD',
    stageId: '',
    customerId: '',
    primaryContactId: '',
    expectedCloseDate: '',
    temperature: '',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const { data: stagesData } = usePipelineStages();
  const { data: customersData } = useCustomersList({ pageSize: 100 });
  const { data: contactsData } = useContactsList({
    customerId: formData.customerId || undefined,
    pageSize: 100,
  });

  const stages = stagesData || [];
  const customers = customersData?.data || [];
  const contacts = contactsData?.data || [];

  const isSubmitting = createDeal.isPending || updateDeal.isPending;

  // Reset form when modal opens or deal changes
  useEffect(() => {
    if (isOpen) {
      if (deal) {
        const closeDate = deal.expectedCloseDate?.split('T')[0] ?? '';
        setFormData({
          name: deal.name,
          value: getDealValueAsNumber(deal).toString(),
          currency: deal.currency ?? 'KWD',
          stageId: deal.stageId,
          customerId: deal.customerId ?? '',
          primaryContactId: deal.primaryContactId ?? '',
          expectedCloseDate: closeDate,
          temperature: deal.temperature ?? '',
          description: deal.description ?? '',
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
          value: '',
          currency: 'KWD',
          stageId: defaultStage?.id || '',
          customerId: '',
          primaryContactId: '',
          expectedCloseDate: '',
          temperature: '',
          description: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, deal, stages, defaultStageId]);

  // Clear contact when customer changes (contacts are filtered by customer)
  useEffect(() => {
    if (!isEditing && formData.customerId) {
      // If the selected contact doesn't belong to the new customer, clear it
      const contactBelongsToCustomer = contacts.some(
        (c) => c.id === formData.primaryContactId
      );
      if (!contactBelongsToCustomer && formData.primaryContactId) {
        setFormData((prev) => ({ ...prev, primaryContactId: '' }));
      }
    }
  }, [formData.customerId, contacts, formData.primaryContactId, isEditing]);

  // Build options
  const stageOptions: SelectOption[] = [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({
      value: stage.id,
      label: stage.name,
    }));

  const customerOptions: SelectOption[] = [
    { value: '', label: 'Select a customer' },
    ...customers.map((customer) => ({
      value: customer.id,
      label: customer.name,
    })),
  ];

  const contactOptions: SelectOption[] = [
    { value: '', label: 'No Contact' },
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

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
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
        value: formData.value ? formData.value : undefined,
        currency: formData.currency,
        stageId: formData.stageId,
        customerId: formData.customerId,
        primaryContactId: formData.primaryContactId || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        temperature: formData.temperature as 'cold' | 'warm' | 'hot' | undefined,
        description: formData.description.trim() || undefined,
      };

      if (isEditing && deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          data: {
            name: data.name,
            value: data.value,
            stageId: data.stageId,
            customerId: data.customerId,
            primaryContactId: data.primaryContactId || null,
            expectedCloseDate: data.expectedCloseDate || null,
            temperature: data.temperature || null,
            description: data.description || null,
          },
        });
      } else {
        await createDeal.mutateAsync(data);
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

        {/* Customer */}
        <Select
          label="Customer"
          value={formData.customerId}
          onChange={(value) => handleChange('customerId', value)}
          options={customerOptions}
          error={errors.customerId}
          placeholder="Select a customer"
        />

        {/* Contact (filtered by customer) */}
        <Select
          label="Primary Contact"
          value={formData.primaryContactId}
          onChange={(value) => handleChange('primaryContactId', value)}
          options={contactOptions}
          placeholder="Link to a contact"
          disabled={!formData.customerId}
        />

        {/* Value and Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              id="value"
              type="number"
              label="Value"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              error={errors.value}
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

        {/* Stage and Temperature */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Stage"
            value={formData.stageId}
            onChange={(value) => handleChange('stageId', value)}
            options={stageOptions}
            error={errors.stageId}
            placeholder="Select stage"
          />
          <Select
            label="Temperature"
            value={formData.temperature}
            onChange={(value) => handleChange('temperature', value)}
            options={temperatureOptions}
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

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
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
