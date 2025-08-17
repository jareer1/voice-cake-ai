export interface SchemaProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  format?: string;
  enum?: string[];
}

export interface ToolSchema {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
}

export interface Tool {
  id?: string;
  name: string;
  description: string;
  input_schema: ToolSchema;
  output_schema: ToolSchema;
  webhook_url: string;
  webhook_secret?: string;
  timeout: number;
  max_retries: number;
  is_active: boolean;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface ToolInvocation {
  id: string;
  tool_id: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  error_message?: string;
  created_at: string;
  completed_at?: string;
  retry_count: number;
}

export interface CreateToolRequest {
  name: string;
  description: string;
  input_schema: ToolSchema;
  output_schema: ToolSchema;
  webhook_url: string;
  webhook_secret?: string;
  timeout?: number;
  max_retries?: number;
  is_active?: boolean;
  is_public?: boolean;
}

export interface UpdateToolRequest extends Partial<CreateToolRequest> {
  id: string;
}
