export interface CapturedUsage {
  status: 'reported' | 'partial' | 'unknown' | 'unavailable';
  counts: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null };
  source: 'provider_response'; estimated: false;
}
export function modelRecordRedactor(model?: Record<string, unknown>): { clean(value: unknown): any; text(value: string): string; add(value: unknown): void };
export function finalizeModelCapture(payload: any, clean?: (value: any) => any): any;
export function normalizeModelMetadata(model?: Record<string, any>): Record<string, any>;
export function modelSamplingParameters(model?: Record<string, any>): Record<string, number>;
export function modelUsage(data: any, usable?: boolean): CapturedUsage;
export function recordUsage(costs: Record<string, any>, usage: CapturedUsage): void;
export function capturedChatCompletion(options: {
  model: Record<string, any>; request: unknown; signal?: AbortSignal;
  emit: (type: string, payload: any, links: Record<string, any>, cause?: any) => Promise<any>;
  onAttempt?: () => void; onUsage?: (usage: CapturedUsage) => void; modelCallId?: string; attempt?: number;
}): Promise<{ data: any; modelCallId: string; requestEvent: any; responseEvent: any; usage: CapturedUsage }>;
