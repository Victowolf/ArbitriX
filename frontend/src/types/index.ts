export type ModelCategory =
  | "Computer Vision"
  | "Code Generation"
  | "Natural Language"
  | "Audio"
  | "Document AI"
  | "Forecasting"
  | "Embeddings"
  | "Speech"
  | "Data Analysis"
  | "Energy"
  | "Logistics"
  | "Finance"
  | "Healthcare"
  | "Retail"
  | "Manufacturing"
  | "Legal"
  | "Other";

export interface ModelPerformance {
  latencyMs: number;
  accuracy: number;
  requests: string;
  tokens: string;
  uptime: number;
}

export interface BlockchainMeta {
  modelId: string;
  creatorWallet: string;
  modelHash: string;
  deployedAt: string;
  txHash: string;
  status: "Verified" | "Pending";
}

export interface AIModel {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  longDescription: string;
  creator: string;
  rating: number;
  reviews: number;
  users: number;
  priceMonthly: number;
  priceYearly: number;
  tags: string[];
  verified: boolean;
  featured?: boolean;
  useCases: string[];
  capabilities: string[];
  input: string;
  output: string;
  pricePerCall?: number;
  proxyUrl?: string;
  performance: ModelPerformance;
  chain: BlockchainMeta;
}

export interface DeployedModel {
  id: string;
  name: string;
  status: "Active" | "Live" | "Paused" | "Pending";
  users: number;
  apiCalls: string | number;
  revenue: number;
  created: string;
  tokens: string;
  proxyUrl?: string;
}

export interface SubscribedModel {
  id: string;
  name: string;
  tokens: string;
  apiCalls: string;
  plan: "Monthly" | "Yearly";
  status: "Active" | "Expiring";
}

export type ChainEventType =
  | "Model Deployed"
  | "Model Subscribed"
  | "Payment Received"
  | "Model Withdrawn"
  | "Review Submitted"
  | "API Key Generated"
  | "Transaction Completed";

export interface ChainEvent {
  id: string;
  type: ChainEventType;
  model: string;
  value?: string;
  wallet?: string;
  txHash?: string;
  at: number;
}

export interface OnChainTx {
  id: string;
  type: "Subscription" | "Payment" | "Withdrawal" | "Deployment" | "Review";
  model: string;
  amount: string;
  wallet: string;
  txHash: string;
  timestamp: string;
  status: "Confirmed" | "Pending";
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  usage: string;
  verified: boolean;
  date: string;
}

export interface ModelAnalytics {
  model: string;
  revenue: number;
  users: number;
  growth: number;
  rating: number;
}

export type TimeRange = "7D" | "30D" | "90D" | "1Y";
