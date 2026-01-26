import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { withdrawAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { validateCPF, validateCNPJ, formatCPFInput, formatCNPJInput } from '../../lib/validation';
import { Loader2, Wallet, Building2, CreditCard, Key, Mail, Phone, Hash, AlertCircle, CheckCircle, Landmark } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

export function WithdrawModal({ open, onOpenChange, availableBalance }: WithdrawModalProps) {
  const [withdrawType, setWithdrawType] = useState<'BANK_ACCOUNT' | 'PIX'>('PIX');
  const [value, setValue] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'>('RANDOM');
  const [pixKeyError, setPixKeyError] = useState<string>('');
  const [pixKeyValid, setPixKeyValid] = useState<boolean>(false);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [agencyDigit, setAgencyDigit] = useState('');
  const [account, setAccount] = useState('');
  const [accountDigit, setAccountDigit] = useState('');
  const [accountType, setAccountType] = useState<'CORRENTE' | 'POUPANCA'>('CORRENTE');
  const [description, setDescription] = useState('');

  const queryClient = useQueryClient();

  const createWithdrawMutation = useMutation({
    mutationFn: (data: any) => withdrawAPI.createWithdraw(data),
    onSuccess: (data) => {
      toast.success('Saque solicitado com sucesso!', {
        description: data.message || 'O valor será transferido conforme a data efetiva.',
      });
      queryClient.invalidateQueries({ queryKey: ['ceo-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['withdraw-balance'] });
      onOpenChange(false);
      // Reset form
      setValue('');
      setPixKey('');
      setBankCode('');
      setAgency('');
      setAccount('');
      setAccountDigit('');
      setDescription('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      
      // Show more specific error messages
      if (errorMessage.includes('chave PIX informada não está cadastrada') || 
          errorMessage.includes('chave não foi encontrada')) {
        toast.error('Chave PIX não encontrada', {
          description: 'A chave PIX informada não está cadastrada no Asaas. Verifique se a chave está correta e cadastrada na sua conta Asaas.',
          duration: 6000,
        });
      } else if (errorMessage.includes('chave PIX informada é inválida')) {
        toast.error('Chave PIX inválida', {
          description: 'A chave PIX informada é inválida. Verifique o formato e tente novamente.',
          duration: 5000,
        });
      } else {
        toast.error('Erro ao processar saque', {
          description: errorMessage,
          duration: 5000,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawValue = parseFloat(value);
    if (isNaN(withdrawValue) || withdrawValue <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (withdrawValue > availableBalance) {
      toast.error('Valor excede o saldo disponível');
      return;
    }

    const withdrawData: any = {
      value: Number(withdrawValue.toFixed(2)), // Ensure it's a number, not string
      type: withdrawType,
      description: description || `Saque de R$ ${withdrawValue.toFixed(2)}`,
    };

    if (withdrawType === 'PIX') {
      if (!pixKey || !pixKey.trim()) {
        toast.error('Chave PIX é obrigatória');
        setPixKeyError('Chave PIX é obrigatória');
        return;
      }

      // Validate PIX key based on type
      let isValid = true;
      let errorMessage = '';

      if (pixKeyType === 'CPF') {
        const cleanCPF = pixKey.replace(/\D/g, '');
        const validation = validateCPF(cleanCPF);
        if (!validation.isValid) {
          isValid = false;
          errorMessage = validation.error || 'CPF inválido';
        }
      } else if (pixKeyType === 'CNPJ') {
        const cleanCNPJ = pixKey.replace(/\D/g, '');
        const validation = validateCNPJ(cleanCNPJ);
        if (!validation.isValid) {
          isValid = false;
          errorMessage = validation.error || 'CNPJ inválido';
        }
      } else if (pixKeyType === 'EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKey.trim())) {
          isValid = false;
          errorMessage = 'E-mail inválido';
        }
      } else if (pixKeyType === 'PHONE') {
        const cleanPhone = pixKey.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          isValid = false;
          errorMessage = 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
        }
      } else if (pixKeyType === 'RANDOM') {
        // UUID format validation (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (pixKey.length < 10 || (!uuidRegex.test(pixKey) && pixKey.length < 32)) {
          isValid = false;
          errorMessage = 'Chave aleatória inválida';
        }
      }

      if (!isValid) {
        setPixKeyError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setPixKeyError('');
      withdrawData.pixKey = pixKey;
      withdrawData.pixKeyType = pixKeyType;
    } else {
      if (!bankCode || !agency || !account || !accountDigit) {
        toast.error('Dados bancários incompletos');
        return;
      }
      if (!accountType) {
        toast.error('Tipo de conta é obrigatório');
        return;
      }
      withdrawData.bankCode = bankCode;
      withdrawData.bankName = bankName;
      withdrawData.agency = agency;
      withdrawData.agencyDigit = agencyDigit;
      withdrawData.account = account;
      withdrawData.accountDigit = accountDigit;
      withdrawData.accountType = accountType; // Ensure this is always set
    }

    // Log data being sent for debugging
    console.log('Withdraw data being sent:', withdrawData);
    createWithdrawMutation.mutate(withdrawData);
  };

  const handleMaxValue = () => {
    setValue(availableBalance.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Solicitar Saque
          </DialogTitle>
          <DialogDescription>
            Saldo disponível: <span className="font-bold text-green-600">{formatCurrency(availableBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor do Saque</Label>
            <div className="flex gap-2">
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0.01"
                max={availableBalance}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMaxValue}
                className="whitespace-nowrap"
              >
                Máximo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor mínimo: R$ 0,01
            </p>
          </div>

          <div className="space-y-2">
            <Label>Forma de Recebimento</Label>
            <RadioGroup value={withdrawType} onValueChange={(v) => setWithdrawType(v as 'BANK_ACCOUNT' | 'PIX')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PIX" id="pix" />
                <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BANK_ACCOUNT" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Conta Bancária
                </Label>
              </div>
            </RadioGroup>
          </div>

          {withdrawType === 'PIX' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX *</Label>
                <div className="relative">
                  <Input
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => {
                      let newValue = e.target.value;
                      
                      // Format based on type while typing
                      if (pixKeyType === 'CPF') {
                        newValue = formatCPFInput(newValue);
                      } else if (pixKeyType === 'CNPJ') {
                        newValue = formatCNPJInput(newValue);
                      } else if (pixKeyType === 'PHONE') {
                        // Format phone: (00) 00000-0000
                        const clean = newValue.replace(/\D/g, '');
                        if (clean.length <= 2) {
                          newValue = clean;
                        } else if (clean.length <= 7) {
                          newValue = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
                        } else {
                          newValue = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
                        }
                      }
                      
                      setPixKey(newValue);
                      
                      // Real-time validation
                      if (newValue && newValue.trim()) {
                        let isValid = false;
                        let errorMsg = '';
                        
                        if (pixKeyType === 'CPF') {
                          const cleanCPF = newValue.replace(/\D/g, '');
                          if (cleanCPF.length === 11) {
                            const validation = validateCPF(cleanCPF);
                            isValid = validation.isValid;
                            errorMsg = validation.error || '';
                          } else if (cleanCPF.length > 0) {
                            isValid = false;
                            errorMsg = cleanCPF.length < 11 ? 'CPF incompleto' : 'CPF inválido';
                          }
                        } else if (pixKeyType === 'CNPJ') {
                          const cleanCNPJ = newValue.replace(/[.\-\/\s]/g, '').toUpperCase();
                          if (cleanCNPJ.length === 14) {
                            const validation = validateCNPJ(cleanCNPJ);
                            isValid = validation.isValid;
                            errorMsg = validation.error || '';
                          } else if (cleanCNPJ.length > 0) {
                            isValid = false;
                            errorMsg = cleanCNPJ.length < 14 ? 'CNPJ incompleto' : 'CNPJ inválido';
                          }
                        } else if (pixKeyType === 'EMAIL') {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          isValid = emailRegex.test(newValue.trim());
                          errorMsg = isValid ? '' : 'E-mail inválido';
                        } else if (pixKeyType === 'PHONE') {
                          const cleanPhone = newValue.replace(/\D/g, '');
                          isValid = cleanPhone.length >= 10 && cleanPhone.length <= 11;
                          errorMsg = isValid ? '' : cleanPhone.length < 10 ? 'Telefone incompleto' : 'Telefone inválido';
                        } else if (pixKeyType === 'RANDOM') {
                          isValid = newValue.length >= 10;
                          errorMsg = isValid ? '' : 'Chave aleatória muito curta';
                        }
                        
                        setPixKeyValid(isValid);
                        setPixKeyError(errorMsg);
                      } else {
                        setPixKeyValid(false);
                        setPixKeyError('');
                      }
                    }}
                    onBlur={() => {
                      // Final validation on blur
                      if (pixKey && pixKey.trim()) {
                        if (pixKeyType === 'CPF') {
                          const cleanCPF = pixKey.replace(/\D/g, '');
                          const validation = validateCPF(cleanCPF);
                          setPixKeyValid(validation.isValid);
                          setPixKeyError(validation.error || '');
                        } else if (pixKeyType === 'CNPJ') {
                          const cleanCNPJ = pixKey.replace(/[.\-\/\s]/g, '').toUpperCase();
                          const validation = validateCNPJ(cleanCNPJ);
                          setPixKeyValid(validation.isValid);
                          setPixKeyError(validation.error || '');
                        } else if (pixKeyType === 'EMAIL') {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          const isValid = emailRegex.test(pixKey.trim());
                          setPixKeyValid(isValid);
                          setPixKeyError(isValid ? '' : 'E-mail inválido');
                        } else if (pixKeyType === 'PHONE') {
                          const cleanPhone = pixKey.replace(/\D/g, '');
                          const isValid = cleanPhone.length >= 10 && cleanPhone.length <= 11;
                          setPixKeyValid(isValid);
                          setPixKeyError(isValid ? '' : 'Telefone deve ter 10 ou 11 dígitos (com DDD)');
                        } else if (pixKeyType === 'RANDOM') {
                          const isValid = pixKey.length >= 10;
                          setPixKeyValid(isValid);
                          setPixKeyError(isValid ? '' : 'Chave aleatória inválida');
                        }
                      }
                    }}
                    placeholder={
                      pixKeyType === 'CPF' ? '000.000.000-00' :
                      pixKeyType === 'CNPJ' ? '00.000.000/0000-00' :
                      pixKeyType === 'EMAIL' ? 'exemplo@email.com' :
                      pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                      'Chave aleatória'
                    }
                    className={`pr-10 ${pixKeyError ? 'border-red-500' : pixKeyValid ? 'border-green-500' : ''}`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pixKeyValid && pixKey && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {pixKeyError && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {pixKeyError && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{pixKeyError}</span>
                  </div>
                )}
                {pixKeyValid && !pixKeyError && (
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span>Chave PIX válida</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                <Select
                  value={pixKeyType}
                  onValueChange={(value) => {
                    setPixKeyType(value as any);
                    setPixKeyError(''); // Clear error when type changes
                    setPixKey(''); // Clear key when type changes
                    setPixKeyValid(false); // Reset validation
                  }}
                >
                  <SelectTrigger id="pixKeyType" className="w-full">
                    <SelectValue placeholder="Selecione o tipo de chave">
                      {pixKeyType === 'RANDOM' && (
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <span>Chave Aleatória</span>
                        </div>
                      )}
                      {pixKeyType === 'CPF' && (
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span>CPF</span>
                        </div>
                      )}
                      {pixKeyType === 'CNPJ' && (
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span>CNPJ</span>
                        </div>
                      )}
                      {pixKeyType === 'EMAIL' && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>E-mail</span>
                        </div>
                      )}
                      {pixKeyType === 'PHONE' && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>Telefone</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RANDOM">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">Chave Aleatória</span>
                          <span className="text-xs text-muted-foreground">UUID gerado pelo banco</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="CPF">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">CPF</span>
                          <span className="text-xs text-muted-foreground">Documento pessoal</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="CNPJ">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">CNPJ</span>
                          <span className="text-xs text-muted-foreground">Documento empresarial</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="EMAIL">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">E-mail</span>
                          <span className="text-xs text-muted-foreground">Endereço de e-mail</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="PHONE">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">Telefone</span>
                          <span className="text-xs text-muted-foreground">Número de celular</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {pixKeyType === 'RANDOM' && 'UUID gerado pelo banco'}
                  {pixKeyType === 'CPF' && 'Documento pessoal (11 dígitos)'}
                  {pixKeyType === 'CNPJ' && 'Documento empresarial (14 dígitos)'}
                  {pixKeyType === 'EMAIL' && 'Endereço de e-mail válido'}
                  {pixKeyType === 'PHONE' && 'Número de celular com DDD (ex: 11987654321)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Código do Banco</Label>
                  <Input
                    id="bankCode"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nome do Banco</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Banco do Brasil"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    placeholder="1234"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyDigit">Dígito</Label>
                  <Input
                    id="agencyDigit"
                    value={agencyDigit}
                    onChange={(e) => setAgencyDigit(e.target.value)}
                    placeholder="X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de Conta *</Label>
                  <Select
                    value={accountType}
                    onValueChange={(value) => setAccountType(value as 'CORRENTE' | 'POUPANCA')}
                  >
                    <SelectTrigger id="accountType" className="w-full">
                      <SelectValue placeholder="Selecione o tipo de conta">
                        {accountType === 'CORRENTE' && (
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            <span>Conta Corrente</span>
                          </div>
                        )}
                        {accountType === 'POUPANCA' && (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <span>Conta Poupança</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRENTE">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">Conta Corrente</span>
                            <span className="text-xs text-muted-foreground">Para movimentações diárias</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="POUPANCA">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">Conta Poupança</span>
                            <span className="text-xs text-muted-foreground">Para investimentos e economia</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {accountType === 'CORRENTE' && 'Conta para movimentações diárias e transações'}
                    {accountType === 'POUPANCA' && 'Conta para investimentos e economia com rendimento'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Input
                    id="account"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="12345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountDigit">Dígito</Label>
                  <Input
                    id="accountDigit"
                    value={accountDigit}
                    onChange={(e) => setAccountDigit(e.target.value)}
                    placeholder="X"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do saque"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createWithdrawMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={createWithdrawMutation.isPending || !value || parseFloat(value) <= 0}
            >
              {createWithdrawMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Solicitar Saque
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

