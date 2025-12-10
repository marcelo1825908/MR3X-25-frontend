import { useState } from 'react'
import { Wrench, Eye, EyeOff, Plus, Edit, Trash2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  config: Record<string, string>;
}

export default function IntegrationsPage() {
  const { hasPermission } = useAuth()

  const canManageIntegrations = hasPermission('integrations:create') || hasPermission('integrations:update')

  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  const [editForm, setEditForm] = useState({
    apiKey: '',
    environment: '',
    workspace: '',
  })

  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    description: '',
  })

  const apiKeys = [
    {
      id: '1',
      name: 'API Principal',
      key: 'mr3x_live_1234567890abcdef',
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date('2024-01-20'),
      isActive: true,
    },
    {
      id: '2',
      name: 'API de Desenvolvimento',
      key: 'mr3x_test_abcdef1234567890',
      createdAt: new Date('2024-01-10'),
      lastUsed: new Date('2024-01-19'),
      isActive: true,
    },
  ]

  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Asaas',
      type: 'payment',
      status: 'connected',
      description: 'Gateway de pagamento',
      config: { apiKey: '***', environment: 'production' },
    },
    {
      id: '2',
      name: 'ZapSign',
      type: 'document',
      status: 'connected',
      description: 'Assinatura digital de documentos',
      config: { apiKey: '***', workspace: 'mr3x' },
    },
    {
      id: '3',
      name: 'WhatsApp Business API',
      type: 'communication',
      status: 'pending',
      description: 'Envio de mensagens via WhatsApp',
      config: {},
    },
    {
      id: '4',
      name: 'SendGrid',
      type: 'communication',
      status: 'disconnected',
      description: 'Envio de emails transacionais',
      config: {},
    },
  ]

  const handleCreateApiKey = () => {
    toast.success('API Key criada com sucesso!')
    setShowApiKeyModal(false)
    setApiKeyForm({ name: '', description: '' })
  }

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
    setEditForm({
      apiKey: integration.config.apiKey || '',
      environment: integration.config.environment || '',
      workspace: integration.config.workspace || '',
    })
    setShowEditModal(true)
  }

  const handleSaveIntegration = () => {
    toast.success(`Integração ${selectedIntegration?.name} atualizada com sucesso!`)
    setShowEditModal(false)
    setSelectedIntegration(null)
    setEditForm({ apiKey: '', environment: '', workspace: '' })
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Conectado
          </Badge>
        )
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pendente</Badge>
      case 'disconnected':
        return (
          <Badge className="bg-gray-500 text-white flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Desconectado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Centro Técnico</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie APIs, integrações e chaves de acesso
          </p>
        </div>
        {canManageIntegrations && (
          <Button onClick={() => setShowApiKeyModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova API Key
          </Button>
        )}
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="integrations" className="flex-shrink-0">Integrações</TabsTrigger>
          <TabsTrigger value="api-keys" className="flex-shrink-0">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" className="flex-shrink-0">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-sm">{integration.description}</CardDescription>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <div className="text-sm font-medium mt-1">
                      {integration.type === 'payment' && 'Pagamento'}
                      {integration.type === 'document' && 'Documento'}
                      {integration.type === 'communication' && 'Comunicação'}
                    </div>
                  </div>

                  {Object.keys(integration.config).length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Configuração</Label>
                      <div className="text-sm mt-1 space-y-1">
                        {Object.entries(integration.config).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono text-xs truncate">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {integration.status === 'disconnected' && (
                      <Button size="sm" className="flex-1">
                        Conectar
                      </Button>
                    )}
                    {integration.status === 'connected' && canManageIntegrations && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditIntegration(integration)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="sm:w-auto">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Gerencie chaves de API para acesso programático</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold">{key.name}</div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(key.id)}
                        >
                          {showApiKey[key.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded inline-block max-w-full">
                        {showApiKey[key.id] ? key.key : '•'.repeat(Math.min(key.key.length, 24))}
                      </code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Criada em {key.createdAt.toLocaleDateString('pt-BR')} - Último uso: {key.lastUsed.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Configure webhooks para receber notificações de eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Webhooks serão implementados em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova API Key</DialogTitle>
            <DialogDescription>
              Crie uma nova chave de API para acesso programático ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key-name">Nome</Label>
              <Input
                id="api-key-name"
                value={apiKeyForm.name}
                onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: API de Integração"
              />
            </div>
            <div>
              <Label htmlFor="api-key-description">Descrição</Label>
              <Input
                id="api-key-description"
                value={apiKeyForm.description}
                onChange={(e) => setApiKeyForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateApiKey}>
                Criar API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Configure as credenciais e parâmetros da integração.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-api-key">API Key</Label>
              <Input
                id="edit-api-key"
                type="password"
                value={editForm.apiKey}
                onChange={(e) => setEditForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Digite a API Key"
              />
            </div>
            {selectedIntegration?.type === 'payment' && (
              <div>
                <Label htmlFor="edit-environment">Ambiente</Label>
                <select
                  id="edit-environment"
                  value={editForm.environment}
                  onChange={(e) => setEditForm(prev => ({ ...prev, environment: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Selecione o ambiente</option>
                  <option value="sandbox">Sandbox (Testes)</option>
                  <option value="production">Produção</option>
                </select>
              </div>
            )}
            {selectedIntegration?.type === 'document' && (
              <div>
                <Label htmlFor="edit-workspace">Workspace</Label>
                <Input
                  id="edit-workspace"
                  value={editForm.workspace}
                  onChange={(e) => setEditForm(prev => ({ ...prev, workspace: e.target.value }))}
                  placeholder="Ex: mr3x"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveIntegration}>
                Salvar Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
