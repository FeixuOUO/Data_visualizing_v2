export interface DataItem {
  date: string;
  sales: number;
  category: string;
  region: string;
  units_sold: number;
  [key: string]: string | number;
}

export interface ProcessingOptions {
  cleanMissingValues: boolean;
  normalizeData: boolean;
  sortData: boolean;
  filterRows: boolean;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface AnalyticSummary {
  totalSales: number;
  topCategory: string;
  topRegion: string;
}
