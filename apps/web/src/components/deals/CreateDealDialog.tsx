import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateDeal } from '@/hooks/useDeals';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/api/client';
import type { Stage } from '@/api/deals';

const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(0, 'Value must be positive'),
  stageId: z.string().min(1, 'Stage is required'),
  currency: z.string().default('KWD'),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stages: Stage[];
}

export function CreateDealDialog({
  open,
  onOpenChange,
  pipelineId,
  stages,
}: CreateDealDialogProps) {
  const createMutation = useCreateDeal();

  const defaultStage = stages.find((s) => s.order === 0) || stages[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      title: '',
      value: 0,
      stageId: defaultStage?.id ?? '',
      currency: 'KWD',
    },
  });

  const selectedStageId = watch('stageId');

  const onSubmit = async (data: CreateDealForm) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        pipelineId,
      });
      toast({
        title: 'Deal created',
        description: `${data.title} has been added to your pipeline.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Failed to create deal',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Deal</DialogTitle>
          <DialogDescription>
            Create a new deal in your pipeline. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal title</Label>
              <Input
                id="title"
                placeholder="Enterprise License for Acme Inc."
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="10000"
                  {...register('value', { valueAsNumber: true })}
                />
                {errors.value && (
                  <p className="text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch('currency')}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KWD">KWD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageId">Stage</Label>
              <Select
                value={selectedStageId}
                onValueChange={(value) => setValue('stageId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.stageId && (
                <p className="text-sm text-red-600">{errors.stageId.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
