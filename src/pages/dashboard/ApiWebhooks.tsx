import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Webhook, Plus, Trash2, Edit, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Send, Eye, Copy, Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

const AVAILABLE_EVENTS = [
  { id: 'property.created', name: 'Property Created', description: 'When a new property is added' },
  { id: 'property.updated', name: 'Property Updated', description: 'When a property is modified' },
  { id: 'property.deleted', name: 'Property Deleted', description: 'When a property is removed' },
  { id: 'contract.created', name: 'Contract Created', description: 'When a new contract is created' },
  { id: 'contract.signed', name: 'Contract Signed', description: 'When a contract is signed' },
  { id: 'contract.terminated', name: 'Contract Terminated', description: 'When a contract ends' },
  { id: 'payment.created', name: 'Payment Created', description: 'When a new payment is registered' },
  { id: 'payment.completed', name: 'Payment Completed', description: 'When a payment is confirmed' },
  { id: 'payment.failed', name: 'Payment Failed', description: 'When a payment fails' },
  { id: 'tenant.created', name: 'Tenant Created', description: 'When a new tenant is added' },
  { id: 'tenant.updated', name: 'Tenant Updated', description: 'When tenant info changes' },
  { id: 'document.uploaded', name: 'Document Uploaded', description: 'When a document is uploaded' },
];

export function ApiWebhooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['api-webhooks', user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api-client/webhooks');
        return response.data;
      } catch {
        // Return mock data for development
        return {
          webhooks: [
            {
              id: '1',
              name: 'Production Webhook',
              url: 'https://myapp.com/webhooks/mr3x',
              events: ['property.created', 'property.updated', 'contract.created', 'payment.completed'],
              isActive: true,
              createdAt: '2024-10-15T10:00:00Z',
              lastTriggeredAt: '2024-12-01T15:30:00Z',
              successRate: 98.5,
              totalDeliveries: 1250,
              failedDeliveries: 19,
            },
            {
              id: '2',
              name: 'Backup Webhook',
              url: 'https://backup.myapp.com/api/webhooks',
              events: ['payment.completed', 'payment.failed'],
              isActive: true,
              createdAt: '2024-11-01T08:00:00Z',
              lastTriggeredAt: '2024-12-01T14:00:00Z',
              successRate: 100,
              totalDeliveries: 456,
              failedDeliveries: 0,
            },
            {
              id: '3',
              name: 'Old Integration',
              url: 'https://old-system.com/hooks',
              events: ['tenant.created'],
              isActive: false,
              createdAt: '2024-06-01T10:00:00Z',
              lastTriggeredAt: '2024-08-30T09:00:00Z',
              successRate: 85.2,
              totalDeliveries: 89,
              failedDeliveries: 13,
            },
          ],
          secret: 'mr3x_whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          deliveryHistory: [
            {
              id: 'd1',
              webhookId: '1',
              event: 'payment.completed',
              status: 'success',
              statusCode: 200,
              timestamp: new Date(Date.now() - 60000).toISOString(),
              responseTime: 145,
              requestBody: { event: 'payment.completed', data: { id: 123, amount: 1500 } },
              responseBody: { received: true },
            },
            {
              id: 'd2',
              webhookId: '1',
              event: 'property.created',
              status: 'success',
              statusCode: 200,
              timestamp: new Date(Date.now() - 120000).toISOString(),
              responseTime: 89,
              requestBody: { event: 'property.created', data: { id: 456, name: 'New Property' } },
              responseBody: { ok: true },
            },
            {
              id: 'd3',
              webhookId: '1',
              event: 'contract.created',
              status: 'failed',
              statusCode: 500,
              timestamp: new Date(Date.now() - 180000).toISOString(),
              responseTime: 2500,
              requestBody: { event: 'contract.created', data: { id: 789 } },
              responseBody: { error: 'Internal server error' },
              retryCount: 3,
            },
            {
              id: 'd4',
              webhookId: '2',
              event: 'payment.completed',
              status: 'success',
              statusCode: 201,
              timestamp: new Date(Date.now() - 240000).toISOString(),
              responseTime: 67,
              requestBody: { event: 'payment.completed', data: { id: 321, amount: 2000 } },
              responseBody: { processed: true },
            },
          ],
        };
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api-client/webhooks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-webhooks'] });
      toast.success('Webhook created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/api-client/webhooks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-webhooks'] });
      toast.success('Webhook updated successfully');
      setShowEditModal(false);
      setSelectedWebhook(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update webhook');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api-client/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-webhooks'] });
      toast.success('Webhook deleted successfully');
      setShowDeleteDialog(false);
      setSelectedWebhook(null);
    },
    onError: () => {
      toast.error('Failed to delete webhook');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.patch(`/api-client/webhooks/${id}/toggle`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-webhooks'] });
      toast.success('Webhook status updated');
    },
    onError: () => {
      toast.error('Failed to update webhook status');
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      const response = await apiClient.post(`/api-client/webhooks/deliveries/${deliveryId}/retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-webhooks'] });
      toast.success('Delivery retry initiated');
    },
    onError: () => {
      toast.error('Failed to retry delivery');
    },
  });

  const resetForm = () => {
    setWebhookUrl('');
    setWebhookName('');
    setSelectedEvents([]);
    setIsActive(true);
  };

  const handleCreate = () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    if (!webhookName.trim()) {
      toast.error('Please enter a webhook name');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    createMutation.mutate({
      name: webhookName,
      url: webhookUrl,
      events: selectedEvents,
      isActive,
    });
  };

  const handleUpdate = () => {
    if (!selectedWebhook) return;

    updateMutation.mutate({
      id: selectedWebhook.id,
      data: {
        name: webhookName,
        url: webhookUrl,
        events: selectedEvents,
        isActive,
      },
    });
  };

  const handleEdit = (webhook: any) => {
    setSelectedWebhook(webhook);
    setWebhookName(webhook.name);
    setWebhookUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setIsActive(webhook.isActive);
    setShowEditModal(true);
  };

  const handleDelete = (webhook: any) => {
    setSelectedWebhook(webhook);
    setShowDeleteDialog(true);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
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
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Configure webhook endpoints for real-time event notifications
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Webhook Secret */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800">Webhook Signing Secret</p>
                <p className="text-sm text-purple-600">Use this to verify webhook signatures</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-1 rounded text-sm font-mono">
                {webhooks?.secret?.substring(0, 12)}••••••••
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhooks?.secret || '', 'Secret')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {/* Webhooks List */}
          {webhooks?.webhooks?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No webhooks configured yet</p>
                <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks?.webhooks?.map((webhook: any) => (
                <Card key={webhook.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{webhook.name}</h3>
                          {webhook.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                          {webhook.url}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: webhook.id, isActive: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(webhook)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(webhook)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className={`font-semibold ${webhook.successRate >= 95 ? 'text-green-600' : webhook.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {webhook.successRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Deliveries</p>
                        <p className="font-semibold">{webhook.totalDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-semibold text-red-600">{webhook.failedDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Triggered</p>
                        <p>{webhook.lastTriggeredAt ? formatDate(webhook.lastTriggeredAt) : 'Never'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Events</p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event: string) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Delivery History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>Last 50 webhook delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {webhooks?.deliveryHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No deliveries yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {webhooks?.deliveryHistory?.map((delivery: any) => (
                    <div key={delivery.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {delivery.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <Badge variant="outline">{delivery.event}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(delivery.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={delivery.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {delivery.statusCode}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {delivery.responseTime}ms
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDeliveryDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {delivery.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryMutation.mutate(delivery.id)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      {delivery.retryCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Retried {delivery.retryCount} time(s)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedWebhook(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update your webhook configuration' : 'Configure a new webhook endpoint'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="webhookName">Webhook Name *</Label>
              <Input
                id="webhookName"
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="e.g., Production Webhook"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl">Endpoint URL *</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhooks"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be HTTPS for production use
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this webhook
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div>
              <Label>Events *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the events that should trigger this webhook
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={event.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {event.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedWebhook(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={showEditModal ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                showEditModal ? 'Update Webhook' : 'Create Webhook'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Modal */}
      <Dialog open={showDeliveryDetails} onOpenChange={setShowDeliveryDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.event} - {formatDate(selectedDelivery?.timestamp || '')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className={selectedDelivery?.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {selectedDelivery?.statusCode}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Response Time</p>
                <p className="font-semibold">{selectedDelivery?.responseTime}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Retries</p>
                <p className="font-semibold">{selectedDelivery?.retryCount || 0}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Request Body</p>
              <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(selectedDelivery?.requestBody, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Response Body</p>
              <pre className={`p-3 rounded-lg text-xs overflow-x-auto ${selectedDelivery?.status === 'failed' ? 'bg-red-50' : 'bg-green-50'}`}>
                {JSON.stringify(selectedDelivery?.responseBody, null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter>
            {selectedDelivery?.status === 'failed' && (
              <Button
                variant="outline"
                onClick={() => {
                  retryMutation.mutate(selectedDelivery.id);
                  setShowDeliveryDetails(false);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Delivery
              </Button>
            )}
            <Button onClick={() => setShowDeliveryDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook "{selectedWebhook?.name}".
              You will stop receiving events at this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedWebhook?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Webhook'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ApiWebhooks;
