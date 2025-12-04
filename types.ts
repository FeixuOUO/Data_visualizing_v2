
export interface DataItem {
  [key: string]: string | number | null | undefined;
}

export interface ProcessingOptions {
  cleanMissingValues: boolean;
  normalizeData: boolean;
  sortData: boolean;
  filterRows: boolean;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ColumnMapping {
  xKey: string;      // For Date/Time axis
  yKey: string;      // For Values/Metrics
  categoryKey: string; // For Grouping/Slices
}
