import type { ActorType } from "@prisma/client";

export interface JwtAccessPayload {
  sub: string;
  type: ActorType;
  email: string;
}

export interface AuthenticatedPrincipal {
  id: string;
  type: ActorType;
  email: string;
}
