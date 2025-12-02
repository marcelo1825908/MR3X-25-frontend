import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  KeyRound, Copy, Eye, EyeOff, RefreshCw, Shield, Clock,
  AlertTriangle, CheckCircle, Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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

export function ApiCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [rotatingField, setRotatingField] = useState<'secret' | 'webhook' | null>(null);

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['api-credentials', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/credentials');
        return response.data;
      } catch {
        // Return mock data for development (using env prefixes with masked values)
        const secretPrefix = import.meta.env.VITE_API_CLIENT_SECRET_PREFIX;
        const publicKeyPrefix = import.meta.env.VITE_API_CLIENT_PUBLIC_KEY_PREFIX;
        const webhookSecretPrefix = import.meta.env.VITE_API_CLIENT_WEBHOOK_SECRET_PREFIX;
        const environment = import.meta.env.VITE_API_CLIENT_ENVIRONMENT;
        const maskedValue = import.meta.env.VITE_API_CLIENT_MASKED_VALUE;

        return {
          clientId: `mr3x_live_cl_${user?.id || 'demo'}`,
          clientSecret: `${secretPrefix}${maskedValue}`,
          publicKey: `${publicKeyPrefix}${maskedValue}`,
          webhookSecret: `${webhookSecretPrefix}${maskedValue}`,
          createdAt: '2024-01-15T10:30:00Z',
          lastRotatedAt: '2024-11-20T14:45:00Z',
          tokenExpiration: {
            accessToken: '1 hour',
            refreshToken: '30 days',
          },
          webhookEnabled: true,
          environment,
        };
      }
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async (field: 'secret' | 'webhook') => {
      const response = await apiClient.post(`/api-client/rotate-${field}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-credentials'] });
      toast.success('Credential rotated successfully!');
      setShowRotateDialog(false);
      setRotatingField(null);
    },
    onError: () => {
      toast.error('Failed to rotate credential');
    },
  });

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

  const maskSecret = (secret: string) => {
    if (!secret) return '';
    return secret.substring(0, 8) + '••••••••••••••••' + secret.substring(secret.length - 4);
  };

  const handleRotate = (field: 'secret' | 'webhook') => {
    setRotatingField(field);
    setShowRotateDialog(true);
  };

  const confirmRotate = () => {
    if (rotatingField) {
      rotateMutation.mutate(rotatingField);
    }
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
      <div>
        <h1 className="text-2xl font-bold">API Credentials</h1>
        <p className="text-muted-foreground mt-1">
          Manage your API keys and secrets for integration
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Keep your credentials secure</p>
            <p className="text-sm text-yellow-700 mt-1">
              Never share your Client Secret or Webhook Secret publicly. Store them securely and use environment variables.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Environment Badge */}
      <div className="flex items-center gap-2">
        <Badge className={credentials?.environment === 'production' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          <Shield className="w-3 h-3 mr-1" />
          {credentials?.environment === 'production' ? 'Production' : 'Sandbox'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Created: {formatDate(credentials?.createdAt || '')}
        </span>
      </div>

      {/* Credentials Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Client ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Client ID
            </CardTitle>
            <CardDescription>
              Your unique client identifier. This can be shared publicly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={credentials?.clientId || ''}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.clientId || '', 'Client ID')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Secret */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-red-500" />
              Client Secret
            </CardTitle>
            <CardDescription>
              Your secret key for authentication. Keep this private and secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={showClientSecret ? credentials?.clientSecret : maskSecret(credentials?.clientSecret || '')}
                readOnly
                className="font-mono bg-gray-50"
                type={showClientSecret ? 'text' : 'password'}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.clientSecret || '', 'Client Secret')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Last rotated: {formatDate(credentials?.lastRotatedAt || '')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate('secret')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rotate Secret
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Public Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-green-500" />
              Public Key
            </CardTitle>
            <CardDescription>
              Used for client-side integrations. Safe to include in frontend code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={credentials?.publicKey || ''}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.publicKey || '', 'Public Key')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Secret */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5 text-purple-500" />
              Webhook Secret
              {credentials?.webhookEnabled ? (
                <Badge className="bg-green-100 text-green-800 ml-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800 ml-2">
                  Disabled
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Used to verify webhook signatures from MR3X to your server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={showWebhookSecret ? credentials?.webhookSecret : maskSecret(credentials?.webhookSecret || '')}
                readOnly
                className="font-mono bg-gray-50"
                type={showWebhookSecret ? 'text' : 'password'}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.webhookSecret || '', 'Webhook Secret')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate('webhook')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rotate Webhook Secret
            </Button>
          </CardContent>
        </Card>

        {/* Token Expiration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Token Expiration
            </CardTitle>
            <CardDescription>
              Default expiration times for access and refresh tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-muted-foreground">Access Token</Label>
                <p className="text-lg font-semibold mt-1">{credentials?.tokenExpiration?.accessToken || '1 hour'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-muted-foreground">Refresh Token</Label>
                <p className="text-lg font-semibold mt-1">{credentials?.tokenExpiration?.refreshToken || '30 days'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotate Confirmation Dialog */}
      <AlertDialog open={showRotateDialog} onOpenChange={setShowRotateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate {rotatingField === 'secret' ? 'Client Secret' : 'Webhook Secret'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new {rotatingField === 'secret' ? 'client secret' : 'webhook secret'}.
              The old one will be immediately invalidated. Make sure to update your application with the new credential.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRotate}
              className="bg-red-600 hover:bg-red-700"
            >
              {rotateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Rotate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ApiCredentials;
