// j'importe la decoration/fonction "Injectable"
// j'importe le Prismaclient
// j'importe l'adapter qui permet a Prisma de communique avec PostgreSQL

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'
import * as dotenv from 'dotenv';

dotenv.config();

// J'applique le décorateur Injectable à PrismaService.
// Cela indique à NestJS que cette classe peut être gérée
// par son système d'injection de dépendances.
//
// PrismaService hérite de PrismaClient grâce à "extends".

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in the environment variables.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}