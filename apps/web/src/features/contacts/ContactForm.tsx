import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useCreateContact, useUpdateContact, useCustomersList } from './useContacts';
import type { Contact } from '@/types';
import type { SelectOption } from '@/components/ui';

export interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact; // If provided, we're editing; otherwise creating
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  title: string;
  department: string;
  customerId: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  notes: string;
}

interface FormErrors {
  firstName?: string;
  customerId?: string;
  email?: string;
}

export function ContactForm({ isOpen, onClose, contact }: ContactFormProps) {
  const isEditing = !!contact;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    title: '',
    department: '',
    customerId: '',
    isPrimary: false,
    isDecisionMaker: false,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const { data: customersData } = useCustomersList();

  const isSubmitting = createContact.isPending || updateContact.isPending;

  // Reset form when modal opens or contact changes
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData({
          firstName: contact.firstName,
          lastName: contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          mobile: contact.mobile || '',
          title: contact.title || '',
          department: contact.department || '',
          customerId: contact.customerId || '',
          isPrimary: contact.isPrimary,
          isDecisionMaker: contact.isDecisionMaker,
          notes: contact.notes || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          mobile: '',
          title: '',
          department: '',
          customerId: '',
          isPrimary: false,
          isDecisionMaker: false,
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, contact]);

  // Build customer options
  const customerOptions: SelectOption[] = [
    { value: '', label: 'Select a customer' },
    ...(customersData?.data || []).map((customer) => ({
      value: customer.id,
      label: customer.name,
    })),
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({
          id: contact.id,
          data: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim() || null,
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            mobile: formData.mobile.trim() || null,
            title: formData.title.trim() || null,
            department: formData.department.trim() || null,
            customerId: formData.customerId,
            isPrimary: formData.isPrimary,
            isDecisionMaker: formData.isDecisionMaker,
            notes: formData.notes.trim() || null,
          },
        });
      } else {
        await createContact.mutateAsync({
          customerId: formData.customerId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          mobile: formData.mobile.trim() || undefined,
          title: formData.title.trim() || undefined,
          department: formData.department.trim() || undefined,
          isPrimary: formData.isPrimary,
          isDecisionMaker: formData.isDecisionMaker,
          notes: formData.notes.trim() || undefined,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (typeof value === 'string' && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'New Contact'}
      description={
        isEditing
          ? 'Update the contact information below.'
          : 'Add a new contact to your network.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer */}
        <Select
          label="Customer"
          value={formData.customerId}
          onChange={(value) => handleChange('customerId', value)}
          options={customerOptions}
          error={errors.customerId}
          placeholder="Select a customer"
        />

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Ahmed"
            autoFocus
          />
          <Input
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Al-Sabah"
          />
        </div>

        {/* Email */}
        <Input
          id="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          placeholder="ahmed@example.com"
        />

        {/* Phone and Mobile */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="phone"
            type="tel"
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+965 2222 3333"
          />
          <Input
            id="mobile"
            type="tel"
            label="Mobile"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            placeholder="+965 9999 1234"
          />
        </div>

        {/* Title and Department */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="title"
            label="Job Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Sales Manager"
          />
          <Input
            id="department"
            label="Department"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="Sales"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => handleChange('isPrimary', e.target.checked)}
              className="h-4 w-4 rounded border-bg-tertiary text-accent focus:ring-accent"
            />
            <span className="text-sm text-text-secondary">Primary Contact</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDecisionMaker}
              onChange={(e) => handleChange('isDecisionMaker', e.target.checked)}
              className="h-4 w-4 rounded border-bg-tertiary text-accent focus:ring-accent"
            />
            <span className="text-sm text-text-secondary">Decision Maker</span>
          </label>
        </div>

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
            placeholder="Additional notes..."
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
            {isEditing ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
