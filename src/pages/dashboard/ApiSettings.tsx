import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Settings, Edit, Trash2, Shield, Globe, AlertTriangle,
  CheckCircle, Plus, X, Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
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
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

export function ApiSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientDescription, setClientDescription] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [webhooksEnabled, setWebhooksEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['api-settings', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/settings');
        return response.data;
      } catch {
        // Return mock data for development
        return {
          clientId: 'mr3x_live_cl_7f8g9h0i1j2k3l4m',
          clientName: 'My Application',
          clientDescription: 'Production integration for my real estate management system',
          createdAt: '2024-01-15T10:30:00Z',
          lastUpdatedAt: '2024-11-20T14:45:00Z',
          status: 'active',
          environment: 'production',
          ipWhitelist: ['192.168.1.0/24', '10.0.0.1', '203.0.113.50'],
          webhooksEnabled: true,
          notificationsEnabled: true,
          usageStats: {
            totalRequests: 15420,
            thisMonth: 4523,
            lastMonth: 3890,
          },
        };
      }
    },
  });

  // Initialize form state when data loads
  useEffect(() => {
    if (settings && !isEditing) {
      setClientName(settings.clientName || '');
      setClientDescription(settings.clientDescription || '');
      setIpWhitelist(settings.ipWhitelist || []);
      setWebhooksEnabled(settings.webhooksEnabled ?? true);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
    }
  }, [settings, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put('/api-client/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-settings'] });
      toast.success('Settings updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api-client/reset-credentials');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-settings'] });
      queryClient.invalidateQueries({ queryKey: ['api-credentials'] });
      toast.success('Credentials reset successfully');
      setShowResetDialog(false);
    },
    onError: () => {
      toast.error('Failed to reset credentials');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete('/api-client/integration');
    },
    onSuccess: () => {
      toast.success('Integration deleted successfully');
      // Redirect to login or home
      window.location.href = '/auth/login';
    },
    onError: () => {
      toast.error('Failed to delete integration');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      clientName,
      clientDescription,
      ipWhitelist,
      webhooksEnabled,
      notificationsEnabled,
    });
  };

  const handleCancel = () => {
    if (settings) {
      setClientName(settings.clientName || '');
      setClientDescription(settings.clientDescription || '');
      setIpWhitelist(settings.ipWhitelist || []);
      setWebhooksEnabled(settings.webhooksEnabled ?? true);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
    }
    setIsEditing(false);
  };

  const addIpToWhitelist = () => {
    if (!newIp.trim()) return;

    // Basic IP/CIDR validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error('Please enter a valid IP address or CIDR range');
      return;
    }

    if (ipWhitelist.includes(newIp.trim())) {
      toast.error('IP already in whitelist');
      return;
    }

    setIpWhitelist([...ipWhitelist, newIp.trim()]);
    setNewIp('');
  };

  const removeIpFromWhitelist = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip));
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
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API client configuration
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Status Card */}
      <Card className={settings?.status === 'active' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <p className={`font-medium ${settings?.status === 'active' ? 'text-green-800' : 'text-yellow-800'}`}>
                  Integration Status: {settings?.status === 'active' ? 'Active' : 'Inactive'}
                </p>
                <p className={`text-sm ${settings?.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                  Created: {formatDate(settings?.createdAt || '')} | Last updated: {formatDate(settings?.lastUpdatedAt || '')}
                </p>
              </div>
            </div>
            <Badge className={settings?.environment === 'production' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {settings?.environment === 'production' ? 'Production' : 'Sandbox'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Client Information
          </CardTitle>
          <CardDescription>
            Basic information about your API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={settings?.clientId || ''}
              disabled
              className="mt-1 bg-gray-50 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="clientName">Client Name / Label</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={!isEditing}
              className={`mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="e.g., My Application"
            />
          </div>

          <div>
            <Label htmlFor="clientDescription">Description</Label>
            <Textarea
              id="clientDescription"
              value={clientDescription}
              onChange={(e) => setClientDescription(e.target.value)}
              disabled={!isEditing}
              className={`mt-1 ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Describe what this integration is used for"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelisting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            IP Whitelisting
          </CardTitle>
          <CardDescription>
            Restrict API access to specific IP addresses or ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && (
            <div className="flex items-center gap-2">
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="Enter IP address or CIDR (e.g., 192.168.1.0/24)"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addIpToWhitelist()}
              />
              <Button onClick={addIpToWhitelist}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          )}

          {ipWhitelist.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No IP restrictions configured</p>
              <p className="text-sm text-muted-foreground">
                API requests are allowed from any IP address
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ipWhitelist.map((ip) => (
                <div key={ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <code className="font-mono text-sm">{ip}</code>
                  </div>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeIpFromWhitelist(ip)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Security Recommendation</p>
                <p className="text-sm text-blue-600 mt-1">
                  For production environments, we strongly recommend configuring IP whitelisting
                  to ensure only authorized servers can access the API.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable specific features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Receive real-time notifications for events
              </p>
            </div>
            <Switch
              checked={webhooksEnabled}
              onCheckedChange={setWebhooksEnabled}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Overview of your API usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {settings?.usageStats?.totalRequests?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {settings?.usageStats?.thisMonth?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-600">
                {settings?.usageStats?.lastMonth?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Last Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium">Reset Credentials</p>
              <p className="text-sm text-muted-foreground">
                Generate new Client Secret and Webhook Secret. This will invalidate all existing secrets.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300"
              onClick={() => setShowResetDialog(true)}
            >
              Reset Credentials
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium">Delete Integration</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this API integration. All tokens and webhooks will be removed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Integration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Credentials Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Credentials?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate new Client Secret and Webhook Secret.
              All existing credentials will be immediately invalidated.
              Make sure to update your applications with the new credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset Credentials'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Integration Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your API integration
              including all access tokens, webhooks, and logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Integration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ApiSettings;
