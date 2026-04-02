import { z } from 'zod';

export const TURN_SOURCES = ['walk-in', 'remote'] as const;
export const TURN_STATUSES = ['waiting', 'called', 'attended', 'cancelled'] as const;

export type TurnSource = (typeof TURN_SOURCES)[number];
export type TurnStatus = (typeof TURN_STATUSES)[number];

const clientNamePattern = /^[\p{L}\p{N}][\p{L}\p{N} '.-]*[\p{L}\p{N}]$/u;

export const turnClientNameSchema = z
  .string({ required_error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(60, 'El nombre debe tener máximo 60 caracteres.')
  .refine((value) => clientNamePattern.test(value), {
    message: 'Solo se permiten letras, números, espacios, apóstrofes, puntos y guiones.',
  });

export const remoteTurnSchema = z.object({
  clientName: turnClientNameSchema,
  source: z.literal('remote').default('remote'),
});

export const walkInTurnSchema = z.object({
  clientName: turnClientNameSchema,
  source: z.literal('walk-in').default('walk-in'),
});

export const turnRecordSchema = z.object({
  id: z.string().uuid(),
  barbershopId: z.string().uuid(),
  turnNumber: z.number().int().positive(),
  clientName: turnClientNameSchema,
  source: z.enum(TURN_SOURCES),
  status: z.enum(TURN_STATUSES),
  joinedAt: z.string().datetime(),
  calledAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  createdByMembershipId: z.string().uuid().nullable(),
});

export type RemoteTurnInput = z.infer<typeof remoteTurnSchema>;
export type WalkInTurnInput = z.infer<typeof walkInTurnSchema>;
export type TurnRecord = z.infer<typeof turnRecordSchema>;

export function normalizeTurnClientName(clientName: string) {
  return turnClientNameSchema.parse(clientName);
}
