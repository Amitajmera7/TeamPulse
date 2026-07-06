export interface DeveloperMetric {
  developer: string;

  estimatedHours: number;
  actualHours: number;

  deliveredHours: number;

  qaBugHours: number;
  uatBugHours: number;

  efficiency: number;
  quality: number;
  contribution: number;
  compliance: number;

  overall: number;
}