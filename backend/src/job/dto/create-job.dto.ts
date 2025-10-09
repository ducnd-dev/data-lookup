export class CreateJobDto {
  name: string;
  jobType: string;
  description?: string;
  fileName?: string;
  metadata?: Record<string, any>;
}