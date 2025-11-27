import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
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

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  role: string;
  status: string;
  plan: string;
  notificationPreferences?: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

export function UserEditPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    document: '',
    role: '',
    status: 'ACTIVE',
    plan: '',
    notificationPreferences: {
      email: true,
      whatsapp: true,
      push: false,
    },
  });

  // Check permissions
  const canEditUsers = hasPermission('users:update');

  // Redirect if no permission
  useEffect(() => {
    if (!canEditUsers) {
      toast.error('You do not have permission to edit users');
      navigate('/dashboard/users');
    }
  }, [canEditUsers, navigate]);

  useEffect(() => {
    if (params.id && canEditUsers) {
      fetchUserDetails(params.id as string);
    }
  }, [params.id, canEditUsers]);

  const fetchUserDetails = async (id: string) => {
    if (!canEditUsers) return;

    try {
      const userData = await usersAPI.getUserById(id);
      setFormData({
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        document: userData.document || '',
        role: userData.role || '',
        status: userData.status || 'ACTIVE',
        plan: userData.plan || '',
        notificationPreferences: userData.notificationPreferences || {
          email: true,
          whatsapp: true,
          push: false,
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user details');
      navigate('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditUsers) {
      toast.error('You do not have permission to edit users');
      return;
    }

    setSaving(true);

    try {
      await usersAPI.updateUser(formData.id, formData);
      toast.success('User updated successfully');
      navigate(`/dashboard/users/${formData.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
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
        ...prev.notificationPreferences!,
        [type]: checked,
      },
    }));
  };

  // Don't render if no permission
  if (!canEditUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to edit users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Update user information</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Information
          </CardTitle>
          <CardDescription>Update the user details below. Some fields may be locked for security reasons.</CardDescription>
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
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                <Label htmlFor="document">CPF / CNPJ</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => handleInputChange('document', e.target.value)}
                  placeholder="123.456.789-00"
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">Document cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
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
                <Label htmlFor="plan">Plan</Label>
                <Input
                  id="plan"
                  value={formData.plan}
                  onChange={(e) => handleInputChange('plan', e.target.value)}
                  placeholder="User plan"
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
                    checked={formData.notificationPreferences?.email || false}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked as boolean)}
                  />
                  <Label htmlFor="email-notifications">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp-notifications"
                    checked={formData.notificationPreferences?.whatsapp || false}
                    onCheckedChange={(checked) => handleNotificationChange('whatsapp', checked as boolean)}
                  />
                  <Label htmlFor="whatsapp-notifications">WhatsApp notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push-notifications"
                    checked={formData.notificationPreferences?.push || false}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked as boolean)}
                  />
                  <Label htmlFor="push-notifications">Push notifications</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
