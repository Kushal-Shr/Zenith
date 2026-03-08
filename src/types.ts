export interface PointerInfo {
  id: string;
  label: string;
  targetNodeId: string;
}

export interface VariableInfo {
  name: string;
  value: string;
}

export interface NodeInfo {
  id: string;
  val: string;
  accessCount?: number;
  isError?: boolean;
  isSuggestion?: boolean;
  errorMessage?: string;
  suggestedFix?: string;
  fixStartLine?: number;
  fixEndLine?: number;
}

export interface EdgeInfo {
  from: string;
  to: string;
  isActivePath?: boolean;
  isError?: boolean;
  isSuggestion?: boolean;
  errorMessage?: string;
  isDangling?: boolean;
}

export interface DSPayload {
  type: string;
  nodes: NodeInfo[];
  edges: EdgeInfo[];
  highlightId: string | null;
  traceInfo: string;
  pointers: PointerInfo[];
  variables: VariableInfo[];
  discardedNodeIds: string[];
  stepLabel: string;
  complexity: string;
}

export interface PlaybackPayload {
  frames: DSPayload[];
}

export interface RoadmapPayload {
  completedTopic: string;
  nextTopic: string;
  reason: string;
  proTip: string;
  pseudocode: string;
  leetcode: { title: string; url: string }[];
  gfgUrl: string;
  template: string;
}
