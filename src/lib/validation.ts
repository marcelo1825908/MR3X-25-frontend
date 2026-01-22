
export interface ValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
  normalized?: string;
  scheme?: 'legacy' | '2026';
}

export function validateCPF(cpf: string): ValidationResult {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve ter 11 dígitos'
    };
  }

  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return {
      isValid: false,
      error: 'CPF inválido (sequência inválida)'
    };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCPF[9]) !== firstDigit || parseInt(cleanCPF[10]) !== secondDigit) {
    return {
      isValid: false,
      error: 'CPF inválido (dígitos verificadores incorretos)'
    };
  }

  return {
    isValid: true,
    formatted: formatCPF(cleanCPF)
  };
}

/**
 * Converte caractere alfanumérico para valor numérico conforme IN RFB 2.229/2024
 * Usa código ASCII - 48 para converter letras e números
 * Exemplo: 'A' (ASCII 65) -> 65 - 48 = 17
 *          '0' (ASCII 48) -> 48 - 48 = 0
 */
function alphanumericToValue(char: string): number {
  const code = char.charCodeAt(0);
  // Números 0-9 (ASCII 48-57)
  if (code >= 48 && code <= 57) {
    return code - 48;
  }
  // Letras A-Z (ASCII 65-90)
  if (code >= 65 && code <= 90) {
    return code - 48;
  }
  return 0;
}

/**
 * Valida CNPJ tradicional (somente números) - formato até julho/2026
 */
function validateTraditionalCNPJ(cnpj: string): ValidationResult {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) {
    return {
      isValid: false,
      error: 'CNPJ deve ter 14 dígitos'
    };
  }

  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return {
      isValid: false,
      error: 'CNPJ inválido (sequência inválida)'
    };
  }

  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i];
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i];
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCNPJ[12]) !== firstDigit || parseInt(cleanCNPJ[13]) !== secondDigit) {
    return {
      isValid: false,
      error: 'CNPJ inválido (dígitos verificadores incorretos)'
    };
  }

  return {
    isValid: true,
    formatted: formatCNPJ(cleanCNPJ),
    normalized: cleanCNPJ,
    scheme: 'legacy',
  };
}

/**
 * Valida CNPJ alfanumérico - novo formato a partir de julho/2026
 * Conforme IN RFB nº 2.229/2024
 * Formato: 8 caracteres (raiz) + 4 caracteres (filial) + 2 dígitos verificadores numéricos
 */
function validateAlphanumericCNPJ(cnpj: string): ValidationResult {
  // Remove pontuação mas mantém letras (convertendo para maiúsculas)
  const cleanCNPJ = cnpj.replace(/[.\-/\\s]/g, '').toUpperCase();

  if (cleanCNPJ.length !== 14) {
    return {
      isValid: false,
      error: 'CNPJ deve ter 14 caracteres'
    };
  }

  const base = cleanCNPJ.substring(0, 12);
  const checkDigits = cleanCNPJ.substring(12, 14);

  // Valida formato: 12 primeiros podem ser letras ou números
  if (!/^[A-Z0-9]{12}$/.test(base)) {
    return {
      isValid: false,
      error: 'CNPJ alfanumérico inválido (formato incorreto)'
    };
  }

  // Os 2 últimos devem ser sempre numéricos (dígitos verificadores)
  if (!/^\d{2}$/.test(checkDigits)) {
    return {
      isValid: false,
      error: 'CNPJ inválido (dígitos verificadores devem ser numéricos)'
    };
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += alphanumericToValue(base[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (firstDigit !== parseInt(checkDigits[0])) {
    return {
      isValid: false,
      error: 'CNPJ inválido (primeiro dígito verificador incorreto)'
    };
  }

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += alphanumericToValue(base[i]) * weights2[i];
  }
  sum += firstDigit * weights2[12];
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  if (secondDigit !== parseInt(checkDigits[1])) {
    return {
      isValid: false,
      error: 'CNPJ inválido (segundo dígito verificador incorreto)'
    };
  }

  return {
    isValid: true,
    formatted: formatAlphanumericCNPJ(cleanCNPJ),
    normalized: cleanCNPJ,
    scheme: '2026',
  };
}

/**
 * Valida CNPJ - suporta tanto formato tradicional quanto alfanumérico (2026)
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  // Limpa e normaliza
  const cleanCNPJ = cnpj.replace(/[.\-/\\s]/g, '').toUpperCase();

  if (cleanCNPJ.length !== 14) {
    return {
      isValid: false,
      error: 'CNPJ deve ter 14 caracteres'
    };
  }

  // Verifica se é formato tradicional (somente números)
  const isAllNumeric = /^\d{14}$/.test(cleanCNPJ);

  if (isAllNumeric) {
    return validateTraditionalCNPJ(cnpj);
  } else {
    return validateAlphanumericCNPJ(cnpj);
  }
}

/**
 * Formata CNPJ alfanumérico no padrão XX.XXX.XXX/XXXX-XX
 */
export function formatAlphanumericCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/[.\-\/\s]/g, '').toUpperCase();
  if (clean.length !== 14) return cnpj;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatCPFInput(value: string): string {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);

  if (cleanValue.length <= 3) {
    return cleanValue;
  } else if (cleanValue.length <= 6) {
    return cleanValue.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  } else if (cleanValue.length <= 9) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
}

/**
 * Formata entrada de CNPJ - suporta formato tradicional (numérico) e alfanumérico (2026)
 * Formato: XX.XXX.XXX/XXXX-XX onde X pode ser letra ou número (exceto últimos 2 que são sempre numéricos)
 */
export function formatCNPJInput(value: string): string {
  if (!value) return '';

  // Remove pontuação mas mantém letras e números, converte para maiúsculas
  const cleanValue = value.replace(/[.\-\/\s]/g, '').toUpperCase().slice(0, 14);

  // Verifica se contém letras (formato alfanumérico 2026)
  const hasLetters = /[A-Z]/.test(cleanValue);

  if (hasLetters) {
    // Formato alfanumérico - permite letras nos primeiros 12 caracteres
    // Valida que apenas os últimos 2 caracteres (se existirem) sejam numéricos
    const base = cleanValue.slice(0, 12).replace(/[^A-Z0-9]/g, '');
    const checkDigits = cleanValue.slice(12, 14).replace(/\D/g, '');
    const combined = base + checkDigits;

    if (combined.length <= 2) {
      return combined;
    } else if (combined.length <= 5) {
      return `${combined.slice(0, 2)}.${combined.slice(2)}`;
    } else if (combined.length <= 8) {
      return `${combined.slice(0, 2)}.${combined.slice(2, 5)}.${combined.slice(5)}`;
    } else if (combined.length <= 12) {
      return `${combined.slice(0, 2)}.${combined.slice(2, 5)}.${combined.slice(5, 8)}/${combined.slice(8)}`;
    } else {
      return `${combined.slice(0, 2)}.${combined.slice(2, 5)}.${combined.slice(5, 8)}/${combined.slice(8, 12)}-${combined.slice(12)}`;
    }
  } else {
    // Formato tradicional - somente números
    const numericValue = cleanValue.replace(/\D/g, '');

    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 5) {
      return numericValue.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    } else if (numericValue.length <= 8) {
      return numericValue.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (numericValue.length <= 12) {
      return numericValue.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else {
      return numericValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
  }
}

/**
 * Formata entrada de documento (CPF ou CNPJ)
 * Detecta automaticamente se é CPF (11 dígitos) ou CNPJ (14 caracteres, pode ser alfanumérico)
 */
export function formatDocumentInput(value: string): string {
  if (!value) return '';

  // Remove pontuação mas mantém letras e números
  const cleanValue = value.replace(/[.\-\/\s]/g, '').toUpperCase();

  // Se contém letras, é CNPJ alfanumérico (2026)
  if (/[A-Z]/.test(cleanValue)) {
    return formatCNPJInput(value);
  }

  // Somente números - decide pelo tamanho
  const numericValue = cleanValue.replace(/\D/g, '');

  if (numericValue.length <= 11) {
    return formatCPFInput(value);
  } else {
    return formatCNPJInput(value);
  }
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export function formatCEPInput(value: string): string {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length <= 5) {
    return cleanValue;
  } else {
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}

export function isValidCEPFormat(cep: string): boolean {
  if (!cep) return false;
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
}

/**
 * Valida documento (CPF ou CNPJ)
 * Suporta CPF (11 dígitos numéricos) e CNPJ (14 caracteres - tradicional ou alfanumérico)
 */
export function validateDocument(document: string): ValidationResult {
  // Remove pontuação mas mantém letras
  const cleanDoc = document.replace(/[.\-\/\s]/g, '').toUpperCase();

  // Se contém letras, é CNPJ alfanumérico (2026)
  if (/[A-Z]/.test(cleanDoc)) {
    if (cleanDoc.length === 14) {
      return validateCNPJ(document);
    }
    return {
      isValid: false,
      error: 'CNPJ alfanumérico deve ter 14 caracteres'
    };
  }

  // Somente números
  const numericDoc = cleanDoc.replace(/\D/g, '');

  if (numericDoc.length === 11) {
    return validateCPF(document);
  } else if (numericDoc.length === 14) {
    return validateCNPJ(document);
  } else {
    return {
      isValid: false,
      error: 'Documento deve ter 11 dígitos (CPF) ou 14 caracteres (CNPJ)'
    };
  }
}

export function formatCRECIInput(value: string): string {
  if (!value) return '';

  let formatted = value.toUpperCase();

  const parts = formatted.split('/');

  if (parts.length === 1) {
    const digits = formatted.replace(/[^0-9]/g, '').slice(0, 10);
    return digits;
  } else {
    const numberPart = parts[0].replace(/[^0-9]/g, '').slice(0, 10);
    let statePart = parts.slice(1).join('/').replace(/[^A-Z-]/g, '').slice(0, 4);

    return numberPart + '/' + statePart;
  }
}
