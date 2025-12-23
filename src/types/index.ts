export interface EventRecord {
  eventName: string;
  payload: any;
  createdAt: string;
}

export interface EventSourcingResult<T = any> {
  entityId: string;
  currentState: T | null;
  eventHistory: EventRecord[];
  totalEvents: number;
  lastEventAt?: string;
}

export interface StreamBatch {
  batch: EventRecord[];
  batchNumber: number;
  totalProcessed: number;
  hasMore: boolean;
  metadata: {
    entityId: string;
    batchSize: number;
    currentState?: any;
  };
}

export interface EventTimeline {
  events: Array<{
    eventName: string;
    timestamp: string;
    changes: string[];
  }>;
  totalEvents: number;
  firstEventAt?: string;
  lastEventAt?: string;
}

export interface EventStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  firstEventAt?: string;
  lastEventAt?: string;
  averageTimeBetweenEvents?: number;
}

export interface UserState {
  id: string;
  name: string;
  email: string;
  role: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrail {
  userId: string;
  auditTrail: Array<{
    timestamp: string;
    action: string;
    changes: string[];
  }>;
  summary: {
    totalChanges: number;
    createdAt?: string;
    lastModified?: string;
    eventBreakdown: Record<string, number>;
  };
}

export interface StateComparison {
  userId: string;
  period: {
    from: string;
    to: string;
  };
  stateComparison: {
    before: UserState | null;
    after: UserState | null;
    changes: Array<{
      field: string;
      from: any;
      to: any;
    }>;
  };
  eventsInPeriod: Array<{
    timestamp: string;
    action: string;
    details: any;
  }>;
}