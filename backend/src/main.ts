import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JobSeederService } from './job/job-seeder.service';
import * as express from 'express';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Increase payload size limit for file uploads and large requests
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    // Set global prefix for all routes
    app.setGlobalPrefix('api');
    
    // Enable CORS for frontend integration
    app.enableCors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Seed default jobs
    const jobSeederService = app.get(JobSeederService);
    await jobSeederService.seedDefaultJobs();
    
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

void bootstrap();
