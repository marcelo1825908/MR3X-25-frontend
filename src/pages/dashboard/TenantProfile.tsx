import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../api';
import {
  User, Mail, Phone, FileText, Upload, CheckCircle,
  ArrowLeft, Camera, Shield, AlertCircle, Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserDetails {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

export function TenantProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const { data: userDetails, isLoading } = useQuery<UserDetails>({
    queryKey: ['user-details', user?.id],
    queryFn: () => usersAPI.getUserDetails(),
  });

  // Update form data when userDetails loads
  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.name || '',
        phone: userDetails.phone || '',
      });
    }
  }, [userDetails]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersAPI.updateUser(user?.id || '', data),
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-details'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const details: UserDetails = userDetails || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {details.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">{details.name || user?.name || 'Usuário'}</h2>
              <p className="text-muted-foreground">{details.email || user?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Badge className="bg-orange-100 text-orange-700">
                  <User className="w-3 h-3 mr-1" />
                  Inquilino
                </Badge>
                {details.status === 'ACTIVE' && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </div>
            </div>
            <div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </div>
          <CardDescription>
            {isEditing
              ? 'Edite suas informações pessoais abaixo'
              : 'Suas informações cadastradas no sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              ) : (
                <p className="text-lg font-medium">{details.name || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg">{details.email || user?.email || '-'}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg">{details.phone || 'Não informado'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg">{details.cpf || 'Não informado'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Documentos</CardTitle>
          </div>
          <CardDescription>
            Envie seus documentos para verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">RG / CNH</p>
              <p className="text-sm text-muted-foreground">Documento de identidade</p>
              <Badge variant="outline" className="mt-2">
                Pendente
              </Badge>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">CPF</p>
              <p className="text-sm text-muted-foreground">Cadastro de Pessoa Física</p>
              <Badge variant="outline" className="mt-2">
                Pendente
              </Badge>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Comprovante de Renda</p>
              <p className="text-sm text-muted-foreground">Holerite ou declaração</p>
              <Badge variant="outline" className="mt-2">
                Pendente
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Documentos para verificação</p>
                <p>
                  O envio de documentos é opcional, mas pode ser solicitado pelo seu
                  locador para verificação de dados. Clique em cada área para fazer upload.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">Data de Criação</p>
              <p className="font-medium">
                {details.createdAt
                  ? new Date(details.createdAt).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">Último Acesso</p>
              <p className="font-medium">
                {details.lastLogin
                  ? new Date(details.lastLogin).toLocaleDateString('pt-BR')
                  : 'Primeiro acesso'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">Segurança</CardTitle>
          </div>
          <CardDescription>
            Configurações de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Autenticação em duas etapas</p>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Configurações</p>
                <p className="text-sm text-muted-foreground">
                  Preferências de segurança da conta
                </p>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Senha</p>
                <p className="text-sm text-muted-foreground">
                  Última alteração: Nunca
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/change-password')}
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
