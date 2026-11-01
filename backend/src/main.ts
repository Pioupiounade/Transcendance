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
			fs.mkdirSync(fullPath, { recursive: true, mode: 0o777 });
		} else {
			fs.chmodSync(fullPath, 0o777);
		}
	});

	const keyPath = process.env.SSL_KEY_PATH ?? path.join(process.cwd(), 'certs/key.pem');
	const certPath = process.env.SSL_CERT_PATH ?? path.join(process.cwd(), 'certs/cert.pem');

	const httpsOptions = {
		key: fs.readFileSync(keyPath),
		cert: fs.readFileSync(certPath),
	};

	const app = await NestFactory.create(AppModule, {
		httpsOptions,
	});

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