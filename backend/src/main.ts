// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';

// async function bootstrap() {

//   (BigInt.prototype as any).toJSON = function () {
//     return this.toString();
//   };

//   const app = await NestFactory.create(AppModule);

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//   }),

//   );

//   await app.listen(process.env.PORT ?? 3000);

// }

// bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
	(BigInt.prototype as any).toJSON = function () {
		return this.toString();
	};

	const uploadDirs = ['uploads/avatars', 'uploads/poi', 'uploads/actions'];

	uploadDirs.forEach((dir) => {
		const fullPath = path.join(process.cwd(), dir);
		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath, { recursive: true });
		}
	});

	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	await app.listen(process.env.PORT ?? 3000);
}

bootstrap();