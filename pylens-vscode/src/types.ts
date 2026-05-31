export interface Requirement {
  id: string;
  title: string;
  url?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AISession {
  tool: string;
  date: string;
  messages: AIMessage[];
  keyPoints?: string[];
  constraints?: string[];
  decisions?: string[];
}

export interface CommitRecord {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export type ProvenanceTarget =
  | { kind: 'function'; functionName: string; filePath: string }
  | { kind: 'file';     filePath: string;     label?: string }
  | { kind: 'files';   filePaths: string[];  label: string };

export interface ProvenanceRecord {
  target: ProvenanceTarget;
  requirement: Requirement;
  aiSession?: AISession;
  commit: CommitRecord;
}
