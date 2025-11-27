import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { DocumentInput } from '../../components/ui/document-input';
import { toast } from 'sonner';
import { validateDocument } from '../../lib/validation';
import { usersAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const ROLES = [
  { value: 'CEO', label: 'CEO - Administrador MR3X' },
  { value: 'ADMIN', label: 'Admin - Administrador Sistema' },
  { value: 'AGENCY_MANAGER', label: 'Gestor - Gerente de Agência' },
  { value: 'BROKER', label: 'Corretor - Agente Imobiliário' },
  { value: 'PROPRIETARIO', label: 'Proprietário - Dono de Imóvel' },
  { value: 'INDEPENDENT_OWNER', label: 'Proprietário Independente - Sem Agência' },
  { value: 'INQUILINO', label: 'Inquilino - Locatário' },
  { value: 'BUILDING_MANAGER', label: 'Síndico - Administrador de Condomínio' },
  { value: 'LEGAL_AUDITOR', label: 'Auditor - Auditoria Legal' },
  { value: 'REPRESENTATIVE', label: 'Representante - Afiliado' },
  { value: 'API_CLIENT', label: 'Cliente API - Integração' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export function UserNewPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    role: '',
    status: 'ACTIVE',
    password: '123456',
    notificationPreferences: {
      email: true,
      whatsapp: true,
      push: false,
    },
  });

  const canCreateUsers = hasPermission('users:create');

  // Redirect if no permission
  useEffect(() => {
    if (!canCreateUsers) {
      toast.error('You do not have permission to create users');
      navigate('/dashboard/users');
    }
  }, [canCreateUsers, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateUsers) {
      toast.error('You do not have permission to create users');
      return;
    }

    setLoading(true);

    try {
      const docResult = validateDocument(formData.document);
      if (!docResult.isValid) {
        toast.error(docResult.error || 'Invalid document (CPF/CNPJ)');
        setLoading(false);
        return;
      }
      await usersAPI.createUser(formData);
      toast.success('User created successfully');
      navigate('/dashboard/users');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: checked,
      },
    }));
  };

  // Don't render if no permission
  if (!canCreateUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to create users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            User Information
          </CardTitle>
          <CardDescription>Fill in the details below to create a new user account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (WhatsApp)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+55 11 91234-5678"
                />
              </div>

              <div className="space-y-2">
                <DocumentInput
                  value={formData.document}
                  onChange={(value) => handleInputChange('document', value)}
                  label="CPF / CNPJ"
                  placeholder="123.456.789-00 ou 00.000.000/0000-00"
                  showValidation={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select role</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Notification Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-notifications"
                    checked={formData.notificationPreferences.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked as boolean)}
                  />
                  <Label htmlFor="email-notifications">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp-notifications"
                    checked={formData.notificationPreferences.whatsapp}
                    onCheckedChange={(checked) => handleNotificationChange('whatsapp', checked as boolean)}
                  />
                  <Label htmlFor="whatsapp-notifications">WhatsApp notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push-notifications"
                    checked={formData.notificationPreferences.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked as boolean)}
                  />
                  <Label htmlFor="push-notifications">Push notifications</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
