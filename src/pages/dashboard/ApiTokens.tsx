import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Code, Plus, Trash2, Copy, Eye, EyeOff,
  Globe, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

const AVAILABLE_SCOPES = [
  { id: 'properties:read', name: 'Properties Read', description: 'Read property data' },
  { id: 'properties:write', name: 'Properties Write', description: 'Create and update properties' },
  { id: 'contracts:read', name: 'Contracts Read', description: 'Read contract data' },
  { id: 'contracts:write', name: 'Contracts Write', description: 'Create and update contracts' },
  { id: 'payments:read', name: 'Payments Read', description: 'Read payment data' },
  { id: 'payments:write', name: 'Payments Write', description: 'Create and process payments' },
  { id: 'tenants:read', name: 'Tenants Read', description: 'Read tenant data' },
  { id: 'tenants:write', name: 'Tenants Write', description: 'Create and update tenants' },
  { id: 'users:read', name: 'Users Read', description: 'Read user data' },
  { id: 'documents:read', name: 'Documents Read', description: 'Read documents' },
  { id: 'documents:write', name: 'Documents Write', description: 'Upload and manage documents' },
  { id: 'webhooks:manage', name: 'Webhooks Manage', description: 'Configure webhooks' },
];

export function ApiTokens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [showNewToken, setShowNewToken] = useState(false);
  const [newTokenValue, setNewTokenValue] = useState('');
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  // Form state
  const [tokenName, setTokenName] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState('30');
  const [ipRestrictions, setIpRestrictions] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['api-tokens', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/tokens');
        return response.data;
      } catch {
        // Return mock data for development
        return [
          {
            id: '1',
            name: 'Production API Token',
            token: 'mr3x_tok_1a2b3c4d5e6f7g8h9i0j',
            createdAt: '2024-11-01T10:00:00Z',
            expiresAt: '2025-11-01T10:00:00Z',
            lastUsedAt: '2024-12-01T15:30:00Z',
            status: 'active',
            scopes: ['properties:read', 'contracts:read', 'payments:read'],
            ipRestrictions: ['192.168.1.0/24', '10.0.0.1'],
          },
          {
            id: '2',
            name: 'Development Token',
            token: 'mr3x_tok_dev_9z8y7x6w5v4u3t2s',
            createdAt: '2024-10-15T08:00:00Z',
            expiresAt: '2024-12-15T08:00:00Z',
            lastUsedAt: '2024-12-01T12:00:00Z',
            status: 'active',
            scopes: ['properties:read', 'properties:write', 'tenants:read'],
            ipRestrictions: [],
          },
          {
            id: '3',
            name: 'Legacy Token',
            token: 'mr3x_tok_old_abc123def456',
            createdAt: '2024-06-01T10:00:00Z',
            expiresAt: '2024-09-01T10:00:00Z',
            lastUsedAt: '2024-08-30T09:00:00Z',
            status: 'expired',
            scopes: ['properties:read'],
            ipRestrictions: [],
          },
        ];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api-client/tokens', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setNewTokenValue(data.token || 'mr3x_tok_new_' + Math.random().toString(36).substring(7));
      setShowNewToken(true);
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create token');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      await apiClient.delete(`/api-client/tokens/${tokenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      toast.success('Token revoked successfully');
      setShowRevokeDialog(false);
      setSelectedToken(null);
    },
    onError: () => {
      toast.error('Failed to revoke token');
    },
  });

  const resetForm = () => {
    setTokenName('');
    setTokenExpiry('30');
    setIpRestrictions('');
    setSelectedScopes([]);
  };

  const handleCreate = () => {
    if (!tokenName.trim()) {
      toast.error('Please enter a token name');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    createMutation.mutate({
      name: tokenName,
      expiresIn: parseInt(tokenExpiry),
      ipRestrictions: ipRestrictions.split('\n').filter(ip => ip.trim()),
      scopes: selectedScopes,
    });
  };

  const handleRevoke = (token: any) => {
    setSelectedToken(token);
    setShowRevokeDialog(true);
  };

  const toggleScope = (scopeId: string) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskToken = (token: string) => {
    if (!token) return '';
    return token.substring(0, 12) + '••••••••••••';
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired || status === 'expired') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    if (status === 'revoked') {
      return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Revoked</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
  };

  const activeTokens = tokens?.filter((t: any) => t.status === 'active' && new Date(t.expiresAt) > new Date()) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Access Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage API access tokens
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Token
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Tokens</p>
              <p className="text-2xl font-bold">{activeTokens.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold">{tokens?.length || 0}</p>
            </div>
            <Code className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired/Revoked</p>
              <p className="text-2xl font-bold">{(tokens?.length || 0) - activeTokens.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Tokens List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tokens</CardTitle>
          <CardDescription>Manage your API access tokens</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tokens created yet</p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Token
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens?.map((token: any) => (
                <div key={token.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{token.name}</h3>
                        {getStatusBadge(token.status, token.expiresAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {visibleTokens.has(token.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(token.token, 'Token')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {token.status === 'active' && new Date(token.expiresAt) > new Date() && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRevoke(token)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{formatDate(token.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p>{formatDate(token.expiresAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p>{token.lastUsedAt ? formatDate(token.lastUsedAt) : 'Never'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IP Restrictions</p>
                      <p>{token.ipRestrictions?.length > 0 ? `${token.ipRestrictions.length} IPs` : 'None'}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Scopes</p>
                    <div className="flex flex-wrap gap-1">
                      {token.scopes?.map((scope: string) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {token.ipRestrictions?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Allowed IPs</p>
                      <div className="flex flex-wrap gap-1">
                        {token.ipRestrictions.map((ip: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Token Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Access Token</DialogTitle>
            <DialogDescription>
              Create a new API token with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="tokenName">Token Name *</Label>
              <Input
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., Production API Token"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tokenExpiry">Token Expiration</Label>
              <Select value={tokenExpiry} onValueChange={setTokenExpiry}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ipRestrictions">IP Restrictions (optional)</Label>
              <Textarea
                id="ipRestrictions"
                value={ipRestrictions}
                onChange={(e) => setIpRestrictions(e.target.value)}
                placeholder="Enter one IP address or CIDR range per line&#10;e.g., 192.168.1.0/24&#10;10.0.0.1"
                className="mt-1 h-24 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to allow requests from any IP
              </p>
            </div>

            <div>
              <Label>Scopes / Permissions *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the permissions this token should have
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={scope.id}
                      checked={selectedScopes.includes(scope.id)}
                      onCheckedChange={() => toggleScope(scope.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={scope.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {scope.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Token Display Modal */}
      <Dialog open={showNewToken} onOpenChange={setShowNewToken}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Token Created Successfully
            </DialogTitle>
            <DialogDescription>
              Copy your new token now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Make sure to copy your token now. For security reasons, we won't show it again.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={newTokenValue}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button
                onClick={() => copyToClipboard(newTokenValue, 'Token')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowNewToken(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the token "{selectedToken?.name}".
              Any applications using this token will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeMutation.mutate(selectedToken?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Token'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ApiTokens;
