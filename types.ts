export interface UserResponse {
  meta: {
    limit: number;
    total: number;
  };
  users: Array<{
    card_num: string;
    name: string;
    balance: number;
    avgBill: string | null;
  }>;
}

export interface RegisterResponse {
  status: string;
  message?: string;
  androidUrl?: string;
  iosUrl?: string;
  authToken?: string;
  details?: {
    validation?: Record<string, string[]>;
  };
}

export interface SessionData {
  __conversations: unknown;
} 