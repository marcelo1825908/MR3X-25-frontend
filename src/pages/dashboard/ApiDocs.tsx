import { useState } from 'react';
import {
  BookOpen, Code, ExternalLink, Copy, ChevronDown, ChevronRight,
  Terminal, FileCode, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  {
    category: 'Properties',
    endpoints: [
      { method: 'GET', path: '/api/v1/properties', description: 'List all properties', auth: true },
      { method: 'GET', path: '/api/v1/properties/:id', description: 'Get property by ID', auth: true },
      { method: 'POST', path: '/api/v1/properties', description: 'Create a new property', auth: true },
      { method: 'PUT', path: '/api/v1/properties/:id', description: 'Update a property', auth: true },
      { method: 'DELETE', path: '/api/v1/properties/:id', description: 'Delete a property', auth: true },
    ],
  },
  {
    category: 'Contracts',
    endpoints: [
      { method: 'GET', path: '/api/v1/contracts', description: 'List all contracts', auth: true },
      { method: 'GET', path: '/api/v1/contracts/:id', description: 'Get contract by ID', auth: true },
      { method: 'POST', path: '/api/v1/contracts', description: 'Create a new contract', auth: true },
      { method: 'PUT', path: '/api/v1/contracts/:id', description: 'Update a contract', auth: true },
      { method: 'POST', path: '/api/v1/contracts/:id/sign', description: 'Sign a contract', auth: true },
      { method: 'POST', path: '/api/v1/contracts/:id/terminate', description: 'Terminate a contract', auth: true },
    ],
  },
  {
    category: 'Payments',
    endpoints: [
      { method: 'GET', path: '/api/v1/payments', description: 'List all payments', auth: true },
      { method: 'GET', path: '/api/v1/payments/:id', description: 'Get payment by ID', auth: true },
      { method: 'POST', path: '/api/v1/payments', description: 'Create a payment', auth: true },
      { method: 'POST', path: '/api/v1/payments/:id/confirm', description: 'Confirm a payment', auth: true },
    ],
  },
  {
    category: 'Tenants',
    endpoints: [
      { method: 'GET', path: '/api/v1/tenants', description: 'List all tenants', auth: true },
      { method: 'GET', path: '/api/v1/tenants/:id', description: 'Get tenant by ID', auth: true },
      { method: 'POST', path: '/api/v1/tenants', description: 'Create a new tenant', auth: true },
      { method: 'PUT', path: '/api/v1/tenants/:id', description: 'Update a tenant', auth: true },
    ],
  },
  {
    category: 'Documents',
    endpoints: [
      { method: 'GET', path: '/api/v1/documents', description: 'List all documents', auth: true },
      { method: 'GET', path: '/api/v1/documents/:id', description: 'Get document by ID', auth: true },
      { method: 'POST', path: '/api/v1/documents', description: 'Upload a document', auth: true },
      { method: 'DELETE', path: '/api/v1/documents/:id', description: 'Delete a document', auth: true },
    ],
  },
];

const ERROR_CODES = [
  { code: 400, name: 'Bad Request', description: 'The request was malformed or missing required parameters' },
  { code: 401, name: 'Unauthorized', description: 'Invalid or missing authentication token' },
  { code: 403, name: 'Forbidden', description: 'You do not have permission to access this resource' },
  { code: 404, name: 'Not Found', description: 'The requested resource does not exist' },
  { code: 409, name: 'Conflict', description: 'The request conflicts with existing data' },
  { code: 422, name: 'Unprocessable Entity', description: 'The request data failed validation' },
  { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded. Please slow down' },
  { code: 500, name: 'Internal Server Error', description: 'An unexpected error occurred on the server' },
  { code: 503, name: 'Service Unavailable', description: 'The service is temporarily unavailable' },
];

const SDK_EXAMPLES = {
  curl: `curl -X GET "https://api.mr3x.com/v1/properties" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`,

  node: `const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.mr3x.com/v1',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

// List properties
const response = await client.get('/properties');
console.log(response.data);

// Create a property
const newProperty = await client.post('/properties', {
  name: 'New Property',
  address: '123 Main St',
  price: 1500.00
});`,

  python: `import requests

BASE_URL = "https://api.mr3x.com/v1"
HEADERS = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
}

# List properties
response = requests.get(f"{BASE_URL}/properties", headers=HEADERS)
properties = response.json()

# Create a property
new_property = requests.post(
    f"{BASE_URL}/properties",
    headers=HEADERS,
    json={
        "name": "New Property",
        "address": "123 Main St",
        "price": 1500.00
    }
)`,

  php: `<?php
$client = new GuzzleHttp\\Client([
    'base_uri' => 'https://api.mr3x.com/v1/',
    'headers' => [
        'Authorization' => 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type' => 'application/json'
    ]
]);

// List properties
$response = $client->get('properties');
$properties = json_decode($response->getBody(), true);

// Create a property
$response = $client->post('properties', [
    'json' => [
        'name' => 'New Property',
        'address' => '123 Main St',
        'price' => 1500.00
    ]
]);`,
};

export function ApiDocs() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Properties');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'PATCH': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Complete reference for the MR3X API
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Getting Started</p>
              <p className="text-xs text-muted-foreground">Quick start guide</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Code className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">OpenAPI/Swagger</p>
              <p className="text-xs text-muted-foreground">Interactive docs</p>
            </div>
            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileCode className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">SDKs</p>
              <p className="text-xs text-muted-foreground">Client libraries</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Error Codes</p>
              <p className="text-xs text-muted-foreground">Error reference</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            All API requests require authentication using Bearer tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Request Header</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => copyToClipboard('Authorization: Bearer YOUR_ACCESS_TOKEN')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <code className="text-green-400 font-mono text-sm">
              Authorization: Bearer YOUR_ACCESS_TOKEN
            </code>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Token Management</p>
                <p className="text-sm text-blue-600 mt-1">
                  Generate and manage your access tokens in the <a href="/dashboard/api-tokens" className="underline">Access Tokens</a> section.
                  Tokens can have specific scopes and expiration times.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
            <code className="text-green-400 font-mono">https://api.mr3x.com/v1</code>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => copyToClipboard('https://api.mr3x.com/v1')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Available endpoints organized by resource</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {API_ENDPOINTS.map((category) => (
              <div key={category.category} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )}
                >
                  <span className="font-medium">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{category.endpoints.length} endpoints</Badge>
                    {expandedCategory === category.category ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
                {expandedCategory === category.category && (
                  <div className="border-t">
                    {category.endpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="p-4 flex items-center gap-4 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <Badge className={`${getMethodColor(endpoint.method)} w-16 justify-center`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                        <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                        {endpoint.auth && (
                          <Badge variant="outline" className="text-xs">
                            Auth Required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Sample code for different programming languages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>
            {Object.entries(SDK_EXAMPLES).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                    {code}
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Error Codes</CardTitle>
          <CardDescription>Common HTTP status codes and their meanings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_CODES.map((error) => (
                  <tr key={error.code} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-3">
                      <Badge className={
                        error.code >= 500 ? 'bg-red-100 text-red-800' :
                        error.code >= 400 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {error.code}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{error.name}</td>
                    <td className="p-3 text-muted-foreground">{error.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>API usage limits and best practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">1000</p>
              <p className="text-sm text-muted-foreground">Requests per minute</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">100</p>
              <p className="text-sm text-muted-foreground">Concurrent connections</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600">10MB</p>
              <p className="text-sm text-muted-foreground">Max request size</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Rate Limit Headers</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Check <code className="bg-yellow-100 px-1 rounded">X-RateLimit-Remaining</code> and{' '}
                  <code className="bg-yellow-100 px-1 rounded">X-RateLimit-Reset</code> headers to track your usage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Downloads */}
      <Card>
        <CardHeader>
          <CardTitle>Official SDKs</CardTitle>
          <CardDescription>Download official client libraries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileCode className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Node.js SDK</p>
                  <p className="text-xs text-muted-foreground">npm install @mr3x/api</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileCode className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Python SDK</p>
                  <p className="text-xs text-muted-foreground">pip install mr3x-api</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileCode className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">PHP SDK</p>
                  <p className="text-xs text-muted-foreground">composer require mr3x/api</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiDocs;
