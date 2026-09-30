import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Mime Filter to allow only specific file types
export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return callback(
      new BadRequestException(
        'Only jpg, jpeg, png, and webp files are allowed',
      ),
      false,
    );
  }

  callback(null, true);
};

export const createStorageOptions = (destinationFolder: string) => {
  return {
    storage: diskStorage({
      destination: `uploads/${destinationFolder}`,
      filename: (
        req: any,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: imageFileFilter,
  };
};