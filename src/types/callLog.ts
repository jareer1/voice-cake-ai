export interface CallLog {
  session_id: string;
  agent_id: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled' | 'expire' | 'expired';
  created_at: string;
  last_accessed: string;
  call_sid: string | null;
  from_number: string | null;
  to_number: string | null;
  participant_name: string;
  participant_identity: string;
  agent_instructions: string;
}

export interface CallLogsResponse {
  total_calls: number;
  calls: CallLog[];
}

export interface CallLogsFilters {
  limit?: number;
  offset?: number;
  status?: string;
  agent_id?: string;
  date_from?: string;
  date_to?: string;
}
