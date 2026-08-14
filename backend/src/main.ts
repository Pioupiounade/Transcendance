import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
     whitelist: true, // enleve les champs qui ne sont pas declarers dans le DTO
     forbidNonWhitelisted: true, //au lieu de juste les enlever, renvoie une erreur si le client envoie un champ inconnu
     transform: true, //transforme les données reçues vers le type/DTO attendu quand c'est possible
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
