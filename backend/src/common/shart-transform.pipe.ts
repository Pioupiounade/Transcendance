import { PipeTransform, Injectable, BadRequestException, Optional } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface WebpCompressorOptions {
  quality?: number; // Qualité de la compression WebP (ex: 80 pour les avatars, 85 pour les photos)
}

@Injectable()
export class WebpCompressorPipe implements PipeTransform<Express.Multer.File, Promise<string>> {
  private readonly quality: number;

  constructor(@Optional() options?: WebpCompressorOptions) {
    this.quality = options?.quality ?? 80; // Par défaut: qualité 80
  }

  async transform(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const input = file.path || file.buffer;

    // Nom du fichier avec extension .webp
    const baseName = path.parse(file.filename).name;
    const webpFilename = `${baseName}.webp`;
    const outputPath = path.join(file.destination, webpFilename);

    try {
      // Conservation de la résolution d'origine + conversion en WebP
      await sharp(input)
        .webp({ quality: this.quality })
        .toFile(outputPath);

      // Si Multer avait sauvegardé un fichier temporaire (ex: .png / .jpg), on le supprime
      if (file.path && file.path !== outputPath) {
        await fs.unlink(file.path).catch(() => {});
      }

      return webpFilename;
    } catch (error) {
      throw new BadRequestException('Failed to process and compress image');
    }
  }
}