import { SetMetadata } from "@nestjs/common";
import type { ActorType } from "@prisma/client";

export const PRINCIPAL_TYPE_KEY = "principalType";
export const RequirePrincipal = (...types: ActorType[]) => SetMetadata(PRINCIPAL_TYPE_KEY, types);
