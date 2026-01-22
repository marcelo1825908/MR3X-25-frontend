import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { validateDocument, formatDocumentInput } from '@/lib/validation';

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

export function DocumentInput({
  value,
  onChange,
  id = 'document',
  label = 'Documento (CPF/CNPJ)',
  placeholder = 'CPF ou CNPJ',
  className,
  disabled = false,
  showValidation = true,
}: DocumentInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; formatted?: string } | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const raw = localValue || '';
    const hasAnyChar = /\d/.test(raw);

    if (hasAnyChar) {
      const result = validateDocument(raw);
      setValidation(result);

      if (result.isValid && result.formatted) {
        if (result.formatted !== localValue) {
          setLocalValue(result.formatted);
          onChange(result.formatted);
        }
      }
    } else {
      setValidation(null);
    }
  }, [localValue, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Use formatDocumentInput from validation library which supports alphanumeric CNPJ
    const formatted = formatDocumentInput(inputValue);

    setLocalValue(formatted);
    onChange(formatted);
  };

  const getInputClassName = () => {
    if (!showValidation) return '';
    if (validation) return validation.isValid ? 'border-green-500' : 'border-red-500';
    return '';
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClassName()}
        />
        {validation && showValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle
                className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-700 transition-colors"
                onClick={() => {
                  setLocalValue('');
                  onChange('');
                  setValidation(null);
                }}
              />
            )}
          </div>
        )}
      </div>
      {validation && !validation.isValid && validation.error && (
        <p className="text-sm text-red-500 mt-1">{validation.error}</p>
      )}
      {validation && validation.isValid && (
        <p className="text-sm text-green-600 mt-1">
          {localValue.replace(/\D/g, '').length === 11 ? 'CPF válido' : 'CNPJ válido'}
        </p>
      )}
    </div>
  );
}
