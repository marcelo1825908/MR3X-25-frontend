import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, UserCheck, UserX, Calendar, Mail, Phone, Shield, Activity } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { usersAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  role: string;
  status: string;
  plan: string;
  createdAt: string;
  lastLogin?: string;
  ownedProperties: Array<{ id: string; name: string }>;
  contracts: Array<{ id: string; status: string }>;
  _count: {
    ownedProperties: number;
    contracts: number;
  };
  audit: Array<{
    timestamp: string;
    event: string;
    userId: string;
  }>;
}

export function UserDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const canEditUsers = hasPermission('users:update') && currentUser?.role !== 'CEO';
  const canDeleteUsers = hasPermission('users:delete');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);

  // Check permissions
  const canViewUsers = hasPermission('users:read');

  // Redirect if no permission
  useEffect(() => {
    if (!canViewUsers) {
      toast.error('You do not have permission to view users');
      navigate('/dashboard/users');
    }
  }, [canViewUsers, navigate]);

  useEffect(() => {
    if (params.id && canViewUsers) {
      fetchUserDetails(params.id as string);
    }
  }, [params.id, canViewUsers]);

  const fetchUserDetails = async (id: string) => {
    if (!canViewUsers) return;

    try {
      const userData = await usersAPI.getUserById(id);
      setUser(userData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user details');
      navigate('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !canDeleteUsers) {
      toast.error('You do not have permission to change user status');
      return;
    }

    try {
      await usersAPI.changeStatus(user.id, newStatus as 'ACTIVE' | 'SUSPENDED', `Status changed to ${newStatus}`);
      toast.success(`User ${newStatus.toLowerCase()}`);
      fetchUserDetails(user.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change user status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INVITED':
        return 'bg-blue-100 text-blue-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'AGENCY_MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'PROPRIETARIO':
        return 'bg-green-100 text-green-800';
      case 'BROKER':
        return 'bg-yellow-100 text-yellow-800';
      case 'INQUILINO':
        return 'bg-gray-100 text-gray-800';
      case 'BUILDING_MANAGER':
        return 'bg-cyan-100 text-cyan-800';
      case 'LEGAL_AUDITOR':
        return 'bg-indigo-100 text-indigo-800';
      case 'REPRESENTATIVE':
        return 'bg-pink-100 text-pink-800';
      case 'API_CLIENT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Don't render if no permission
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view users.</p>
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">User Profile Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEditUsers && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/users/${user.id}/edit`)} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit User
            </Button>
          )}
          {canDeleteUsers &&
            (user.status === 'ACTIVE' ? (
              <Button variant="destructive" onClick={() => handleStatusChange('SUSPENDED')} className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Suspend
              </Button>
            ) : (
              <Button onClick={() => handleStatusChange('ACTIVE')} className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Activate
              </Button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">ID</Label>
                  <p className="text-sm">#{user.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm">{user.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Document</Label>
                  <p className="text-sm">{user.document || 'Not provided'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                  <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                  <Badge variant="outline">{user.plan}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Entities */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Entities</CardTitle>
              <CardDescription>Properties and contracts associated with this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Properties ({user._count?.ownedProperties || 0})</h4>
                {user.ownedProperties && user.ownedProperties.length > 0 ? (
                  <div className="space-y-2">
                    {user.ownedProperties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Property #{property.id}</span>
                        <span className="text-sm text-muted-foreground">{property.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No properties linked</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Contracts ({user._count?.contracts || 0})</h4>
                {user.contracts && user.contracts.length > 0 ? (
                  <div className="space-y-2">
                    {user.contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Contract #{contract.id}</span>
                        <Badge variant="outline">{contract.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No contracts linked</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created at</Label>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last login</Label>
                <p className="text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.audit && user.audit.length > 0 ? (
                <div className="space-y-3">
                  {user.audit.slice(0, 5).map((log, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.event}</span>
                        <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
