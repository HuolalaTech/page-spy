export type Category =
  | 'Element'
  | 'Javascript'
  | 'Feature'
  | 'Network'
  | 'Storage'
  | 'CSS';
export interface FeatureDescriptor {
  title: string;
  keyPath?: string;
  customTest?: string;
  supported?: boolean;
}
export type Feature = Record<Category, Record<string, FeatureDescriptor>>;

export interface DataItem {
  id: string;
  system: {
    ua?: string;
    [other: string]: string;
  };
  mp?: string; // this should be a stringified json, or the object will
  features: Record<Category, FeatureDescriptor[]>;
}
