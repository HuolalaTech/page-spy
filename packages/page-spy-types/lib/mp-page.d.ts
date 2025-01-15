export interface MPPageInfo {
  id: number;
  route: string;
  data?: Record<string, any>;
}
export interface DataItem {
  pages: MPPageInfo[];
}
