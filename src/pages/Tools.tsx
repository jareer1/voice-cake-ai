import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Eye, Settings, Webhook, Shield } from "lucide-react";
import { useAuth } from "@/context/authContext";
import api from "@/pages/services/api";

interface SchemaProperty {
  id?: string; // Add unique ID for stable React keys
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  format?: string;
  enum?: string[];
}

interface Tool {
  id?: string | number;
  name: string;
  description: string;
  input_schema?: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  output_schema?: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  webhook_url?: string;
  webhook_secret?: string;
  timeout?: number | null;
  max_retries?: number;
  is_active: boolean;
  is_public: boolean;
  // Additional fields from API
  total_calls?: number;
  successful_calls?: number;
  success_rate?: number;
  is_healthy?: boolean;
  last_used?: string | null;
  created_at?: string;
}

export default function Tools() {
  const { token } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showForm, setShowForm] = useState(false);



  // Form states
  const [formData, setFormData] = useState<Tool>({
    name: '',
    description: '',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    output_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    webhook_url: '',
    webhook_secret: '',
    timeout: null,
    max_retries: 3,
    is_active: true,
    is_public: false
  });

  const [inputProperties, setInputProperties] = useState<SchemaProperty[]>([]);
  // Output properties removed - third-party tools handle their own response format



  // Load tools on component mount
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tools/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle standardized backend response format
      let toolsData = [];
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true && Array.isArray(response.data.data)) {
          // Standardized response format
          toolsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Legacy format - direct array
          toolsData = response.data;
        } else if (response.data.tools && Array.isArray(response.data.tools)) {
          // Legacy nested structure
          toolsData = response.data.tools;
        } else {
          console.warn('Unexpected tools API response format:', response.data);
          toolsData = [];
        }
      }

      setTools(toolsData);
    } catch (error) {
      setError('Failed to load tools');
      console.error('Error loading tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      input_schema: {
        type: 'object',
        properties: {},
        required: []
      },
      output_schema: {
        type: 'object',
        properties: {},
        required: []
      },
      webhook_url: '',
      webhook_secret: '',
      timeout: null,
      max_retries: 3,
      is_active: true,
      is_public: false
    });
    setInputProperties([]);
    setEditingTool(null);
    setShowForm(false);
  };

  const addInputProperty = useCallback(() => {
    const newProperty: SchemaProperty = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
      name: '',
      type: 'string',
      description: '',
      required: false
    };

    setInputProperties(prevProperties => [...prevProperties, newProperty]);
  }, []);

  const updateInputProperty = useCallback((
    index: number,
    field: keyof SchemaProperty,
    value: any
  ) => {
    setInputProperties(prevProperties => {
      const updatedProperties = [...prevProperties];
      
      if (field === 'enum') {
        (updatedProperties[index] as any)[field] = value ? value.split(',').map((v: string) => v.trim()) : undefined;
      } else {
        (updatedProperties[index] as any)[field] = value;
      }

      return updatedProperties;
    });
  }, []);

  const removeInputProperty = useCallback((index: number) => {
    setInputProperties(prevProperties => prevProperties.filter((_, i) => i !== index));
  }, []);

  const buildSchema = (properties: SchemaProperty[]) => {
    const schemaProperties: Record<string, any> = {};
    const required: string[] = [];

    properties.forEach(prop => {
      if (!prop.name) return;

      const schemaProp: any = {
        type: prop.type,
        description: prop.description
      };

      if (prop.format) {
        schemaProp.format = prop.format;
      }

      if (prop.enum && prop.enum.length > 0) {
        schemaProp.enum = prop.enum;
      }

      schemaProperties[prop.name] = schemaProp;

      if (prop.required) {
        required.push(prop.name);
      }
    });

    return {
      type: 'object' as const,
      properties: schemaProperties,
      required
    };
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Tool name is required';
    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) return 'Tool name must contain only alphanumeric characters and underscores';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.webhook_url.trim()) return 'Webhook URL is required';
    if (!/^https?:\/\/.+/.test(formData.webhook_url)) return 'Webhook URL must start with http:// or https://';
    
    // Validate timeout - check for empty value and range
    if (formData.timeout === null || formData.timeout === undefined) {
      return 'Timeout is required';
    }
    if (typeof formData.timeout === 'number' && (formData.timeout < 10 || formData.timeout > 300)) {
      return 'Timeout must be between 10 and 300 seconds';
    }
    
    if (formData.max_retries < 1 || formData.max_retries > 10) return 'Max retries must be between 1 and 10';

    // Validate that at least one input property has a name
    const validInputs = inputProperties.filter(p => p.name.trim());
    if (validInputs.length === 0) return 'At least one input property is required';

    // Output properties are optional for third-party tools
    // The third-party service will handle the response format

    return null;
  };

  const saveTool = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const toolData = {
        ...formData,
        input_schema: buildSchema(inputProperties.filter(p => p.name.trim())),
        // For third-party tools, use a minimal output schema
        // The actual response format is handled by the third-party service
        output_schema: {
          type: 'object' as const,
          properties: {
            result: {
              type: 'object',
              description: 'Response from the third-party service'
            }
          },
          required: []
        }
      };

      if (editingTool) {
        const response = await api.put(`/tools/${editingTool.id}/`, toolData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Update tool response:', response.data);
        
        // Handle response format - backend returns tool data directly on success
        if (response.data && typeof response.data === 'object') {
          if (response.data.success === true) {
            // Standardized response format
            setSuccess(response.data.message || 'Tool updated successfully');
          } else if (response.data.success === false) {
            // Error in standardized format
            throw new Error(response.data.message || 'Failed to update tool');
          } else if (response.data.id) {
            // Direct tool data response (success)
            setSuccess('Tool updated successfully');
          } else {
            // Unknown response format, assume success if we got data
            setSuccess('Tool updated successfully');
          }
        } else {
          setSuccess('Tool updated successfully');
        }
      } else {
        const response = await api.post('/tools/', toolData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Create tool response:', response.data);
        
        // Handle response format - backend returns tool data directly on success
        if (response.data && typeof response.data === 'object') {
          if (response.data.success === true) {
            // Standardized response format
            setSuccess(response.data.message || 'Tool created successfully');
          } else if (response.data.success === false) {
            // Error in standardized format
            throw new Error(response.data.message || 'Failed to create tool');
          } else if (response.data.id) {
            // Direct tool data response (success)
            setSuccess('Tool created successfully');
          } else {
            // Unknown response format, assume success if we got data
            setSuccess('Tool created successfully');
          }
        } else {
          setSuccess('Tool created successfully');
        }
      }

      await loadTools();
      resetForm();
    } catch (error: any) {
      console.error('Error saving tool:', error);
      console.error('Error response:', error.response?.data);
      
      // Try to extract meaningful error message
      let errorMessage = 'Failed to save tool';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const editTool = (tool: Tool) => {
    // Fill in default values for optional fields
    const toolWithDefaults = {
      ...tool,
      webhook_url: tool.webhook_url || '',
      timeout: tool.timeout ?? null, // Allow null, don't default to 120
      max_retries: tool.max_retries || 3,
      input_schema: tool.input_schema || { type: 'object' as const, properties: {}, required: [] },
      output_schema: tool.output_schema || { type: 'object' as const, properties: {}, required: [] }
    };
    
    setFormData(toolWithDefaults);
    setEditingTool(tool);
    setShowForm(true);

    // Parse input schema back into properties
    const inputProps = Object.entries(toolWithDefaults.input_schema.properties || {}).map(([name, schema]: [string, any]) => ({
      name,
      type: schema.type,
      description: schema.description || '',
      required: toolWithDefaults.input_schema.required?.includes(name) || false,
      format: schema.format,
      enum: schema.enum
    }));

    setInputProperties(inputProps);
    // Output properties not needed for third-party tools
  };

  const deleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      const response = await api.delete(`/tools/${toolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle response format - backend might return data directly or use standardized format
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          // Standardized response format
          setSuccess(response.data.message || 'Tool deleted successfully');
        } else if (response.data.success === false) {
          // Error in standardized format
          throw new Error(response.data.message || 'Failed to delete tool');
        } else {
          // Direct response or unknown format, assume success if we got a response
          setSuccess('Tool deleted successfully');
        }
      } else {
        setSuccess('Tool deleted successfully');
      }
      
      await loadTools();
    } catch (error) {
      setError('Failed to delete tool');
      console.error('Error deleting tool:', error);
    }
  };

  // Separate component for property input to prevent re-renders
  const PropertyInput: React.FC<{
    property: SchemaProperty;
    index: number;
    onUpdate: (index: number, field: keyof SchemaProperty, value: any) => void;
    onRemove: (index: number) => void;
  }> = React.memo(({ property, index, onUpdate, onRemove }) => {
    return (
      <Card key={property.id || `fallback-${index}`} className="p-4 border border-gray-200">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Property Name*</Label>
              <Input
                value={property.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                placeholder="property_name"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>Type*</Label>
              <select
                value={property.type}
                onChange={(e) => onUpdate(index, 'type', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description*</Label>
              <Input
                value={property.description}
                onChange={(e) => onUpdate(index, 'description', e.target.value)}
                placeholder="Property description"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={property.required}
                onChange={(e) => onUpdate(index, 'required', e.target.checked)}
              />
              <Label>Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onRemove(index)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Property
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  });

  const PropertyEditor: React.FC<{
    properties: SchemaProperty[];
    type: 'input' | 'output';
    onAdd: () => void;
    onUpdate: (index: number, field: keyof SchemaProperty, value: any) => void;
    onRemove: (index: number) => void;
  }> = useCallback(({ properties, type, onAdd, onUpdate, onRemove }) => {
      return (
        <div className="space-y-4 p-2 bg-gray-50 min-h-[200px]">
          <div className="flex items-center justify-between bg-white p-3 rounded border">
            <h4 className="font-medium text-lg">
              {type === 'input' ? 'Input' : 'Output'} Properties
            </h4>
            <Button 
              onClick={onAdd}
              size="sm" 
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>

          {properties.map((property, index) => (
            <PropertyInput
              key={property.id || `fallback-${type}-${index}`}
              property={property}
              index={index}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}

          {properties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground bg-white p-4 rounded border">
              No {type} properties defined. Click "Add Property" to get started.
            </div>
          )}
        </div>
      );
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom Tools</h1>
            <p className="text-muted-foreground">
              Create and manage custom tools for your AI agents
            </p>
          </div>
          <Button 
            onClick={() => {
              setError(null);
              setSuccess(null);
              setShowForm(true);
            }} 
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tool
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-destructive">
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500">
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Tools List */}
        {!showForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {tool.is_active && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {tool.is_public && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tool.webhook_url && (
                      <div className="text-sm">
                        <span className="font-medium">Webhook:</span>
                        <p className="text-muted-foreground truncate">{tool.webhook_url}</p>
                      </div>
                    )}
                    
                    {/* Tool Statistics */}
                    {(tool.total_calls !== undefined || tool.success_rate !== undefined) && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Total Calls:</span>
                          <span>{tool.total_calls || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span>{((tool.success_rate || 0) * 100).toFixed(1)}%</span>
                        </div>
                        {tool.last_used && (
                          <div className="flex justify-between">
                            <span>Last Used:</span>
                            <span>{new Date(tool.last_used).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex text-xs text-muted-foreground gap-4">
                      {tool.timeout && <span>Timeout: {tool.timeout}s</span>}
                      {tool.max_retries && <span>Retries: {tool.max_retries}</span>}
                      {tool.is_healthy !== undefined && (
                        <span className={tool.is_healthy ? 'text-green-600' : 'text-red-600'}>
                          {tool.is_healthy ? '✓ Healthy' : '✗ Unhealthy'}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => editTool(tool)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => tool.id && deleteTool(tool.id.toString())}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {tools.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No tools created yet</h3>
                  <p>Create your first custom tool to get started</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool Creation/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingTool ? 'Edit Tool' : 'Create New Tool'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="input">Input Schema</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook Config</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tool Name*</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="BookingTool"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alphanumeric characters and underscores only
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook_url">Webhook URL*</Label>
                      <Input
                        id="webhook_url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                        placeholder="https://your-api.com/booking-webhook"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Description*</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Books appointments for customers with validation and confirmation"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)*</Label>
                      <Input
                        id="timeout"
                        type="text"
                        placeholder="Enter timeout in seconds (10-300)"
                        value={formData.timeout === null || formData.timeout === undefined ? '' : formData.timeout.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            // Allow empty value
                            setFormData({...formData, timeout: null as any});
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                              setFormData({...formData, timeout: numValue});
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be between 10 and 300 seconds
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_retries">Max Retries*</Label>
                      <Input
                        id="max_retries"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.max_retries}
                        onChange={(e) => setFormData({...formData, max_retries: parseInt(e.target.value) || 3})}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                      />
                      <Label htmlFor="is_public">Public</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="input" className="space-y-6">
                    <PropertyEditor
                      properties={inputProperties}
                      type="input"
                      onAdd={addInputProperty}
                      onUpdate={(index, field, value) => updateInputProperty(index, field, value)}
                      onRemove={(index) => removeInputProperty(index)}
                    />
                </TabsContent>



                <TabsContent value="webhook" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook_secret">Webhook Secret</Label>
                      <Input
                        id="webhook_secret"
                        type="password"
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData({...formData, webhook_secret: e.target.value})}
                        placeholder="your_webhook_secret_key"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional HMAC secret for webhook authentication
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Webhook className="w-4 h-4" />
                        Third-Party Tool Integration
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Your webhook will receive POST requests when this tool is invoked</p>
                        <p>• Request body will contain the tool inputs as JSON</p>
                        <p>• Your service can return any JSON response format</p>
                        <p>• No output schema definition needed - your service handles the response</p>
                        <p>• Webhook secret will be sent in the X-Webhook-Secret header for security</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-800">Example Request to Your Webhook</h4>
                      <pre className="text-xs bg-white p-2 rounded border text-blue-700">
{`POST /your-webhook-url
Content-Type: application/json
X-Webhook-Secret: your_secret_key

{
  "customer_name": "John Doe",
  "service_type": "consultation",
  "preferred_date": "2024-01-15"
}`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6 border-t">
                <Button onClick={resetForm} variant="outline">
                  Cancel
                </Button>
                <Button onClick={saveTool} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : editingTool ? 'Update Tool' : 'Create Tool'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
