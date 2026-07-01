import { Injectable } from "@nestjs/common";
import type { ActorType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    bucket: string;
    objectKey: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedByType: ActorType;
    uploadedById?: string;
  }) {
    return this.prisma.media.create({ data });
  }

  findById(id: string) {
    return this.prisma.media.findUnique({ where: { id } });
  }

  delete(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }
}
