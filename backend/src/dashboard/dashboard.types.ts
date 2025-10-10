export interface DashboardStats {
  totalUsers: number;
  activeJobs: number;
  dataRecords: number;
  uploadsToday: number;
  userGrowth: number;
  jobGrowth: number;
  recordGrowth: number;
  uploadGrowth: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'job' | 'upload' | 'system';
  timestamp: Date;
  userId?: number;
  userName?: string;
  status: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface QuickStats {
  [key: string]: number;
}