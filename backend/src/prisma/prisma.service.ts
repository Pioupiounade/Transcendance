// j'importe la decoration/fonction "Injectable"
// j'importe le Prismaclient
// j'importe l'adapter qui permet a Prisma de communique avec PostgreSQL

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';


// J'applique le décorateur Injectable à PrismaService.
// Cela indique à NestJS que cette classe peut être gérée
// par son système d'injection de dépendances.
//
// PrismaService hérite de PrismaClient grâce à "extends".

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter });
  }
}