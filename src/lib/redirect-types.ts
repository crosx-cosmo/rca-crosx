export type IssueLevel = "error" | "warning" | "info";

export interface RedirectHop {
  index: number;
  url: string;
  protocol: "http" | "https" | "other";
  status: number;
  statusText: string;
  redirectType: string;
  responseTimeMs: number;
  location: string | null;
  resolvedLocation: string | null;
  server: string | null;
  ip: string | null;
  headers: Record<string, string>;
  params: Record<string, string>;
}

export interface AnalysisIssue {
  id: string;
  level: IssueLevel;
  title: string;
  detail: string;
  hopIndex?: number;
}

export interface SeoInfo {
  finalStatus: number | null;
  https: boolean;
  canonical: string | null;
  metaRobots: string | null;
  chainLength: number;
}

export type ParamChangeKind = "added" | "removed" | "modified";

export interface ParamChange {
  param: string;
  kind: ParamChangeKind;
  from: string | null;
  to: string | null;
  tracking: boolean;
}

export interface HopParamDiff {
  fromIndex: number;
  toIndex: number;
  fromUrl: string;
  toUrl: string;
  changes: ParamChange[];
}

export interface TrackingReport {
  diffs: HopParamDiff[];
  startParams: Record<string, string>;
  finalParams: Record<string, string>;
  lostTrackingParams: string[];
  keptTrackingParams: string[];
}

export interface RedirectAnalysis {
  startUrl: string;
  hops: RedirectHop[];
  finalUrl: string;
  finalStatus: number | null;
  totalHops: number;
  totalRedirects: number;
  totalResponseTimeMs: number;
  redirectLoop: boolean;
  seo: SeoInfo;
  issues: AnalysisIssue[];
  tracking: TrackingReport;
  source: "live" | "demo";
  analyzedAt: string;
  error: string | null;
}
