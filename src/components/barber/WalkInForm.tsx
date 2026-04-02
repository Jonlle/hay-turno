import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { turnClientNameSchema } from '../../schemas/turn';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';

const walkInFormSchema = z.object({
  clientName: turnClientNameSchema,
});

type WalkInFormData = z.infer<typeof walkInFormSchema>;

interface WalkInFormProps {
  onSubmit: (clientName: string) => void;
  isSubmitting: boolean;
  defaultName?: string;
  error?: Error | null;
}

export function WalkInForm({
  onSubmit,
  isSubmitting,
  defaultName = '',
  error,
}: WalkInFormProps) {
  const selectedOnce = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WalkInFormData>({
    resolver: zodResolver(walkInFormSchema),
    defaultValues: { clientName: defaultName },
  });

  // Sync defaultName when it changes (only if user hasn't typed)
  useEffect(() => {
    if (!isDirty) {
      reset({ clientName: defaultName });
    }
  }, [defaultName, isDirty, reset]);

  const handleFormSubmit = (data: WalkInFormData) => {
    onSubmit(data.clientName);
    reset({ clientName: defaultName });
    selectedOnce.current = false;
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!selectedOnce.current) {
      e.target.select();
      selectedOnce.current = true;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="ht-card space-y-3"
      data-testid="walk-in-form"
    >
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        Registrar Walk-in
      </h3>

      <div>
        <input
          {...register('clientName')}
          type="text"
          placeholder="Nombre del cliente"
          className="ht-input"
          disabled={isSubmitting}
          aria-label="Nombre del cliente"
          data-testid="walk-in-name-input"
          onFocus={handleFocus}
        />
        {errors.clientName && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.clientName.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs" role="alert">
          No se pudo registrar. Intenta de nuevo.
        </p>
      )}

      <button
        type="submit"
        className="ht-btn-primary w-full flex items-center justify-center gap-2"
        disabled={isSubmitting}
        data-testid="walk-in-submit"
      >
        <UserPlus className="w-4 h-4" />
        {isSubmitting ? 'Registrando...' : 'Agregar a la cola'}
      </button>
    </form>
  );
}
