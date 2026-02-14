
/**
 * Formato para valores monetários em Reais (BRL)
 */
export const formatCurrency = (value: number | null): string => {
  if (value === null) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('pt-BR');
};

/**
 * Formata um número de telefone com a máscara brasileira
 */
export const formatPhone = (value: string | null): string => {
  if (!value) return "-";
  
  // Remove caracteres não numéricos
  const phone = value.replace(/\D/g, '');
  
  if (phone.length <= 10) {
    // Formato (00) 0000-0000
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    // Formato (00) 00000-0000
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};

/**
 * Formata um CPF com máscara (000.000.000-00)
 */
export const formatCPF = (value: string | null): string => {
  if (!value) return "-";
  
  // Remove caracteres não numéricos
  const cpf = value.replace(/\D/g, '');
  
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um CNPJ com máscara (00.000.000/0001-00)
 */
export const formatCNPJ = (value: string | null): string => {
  if (!value) return "-";
  
  // Remove caracteres não numéricos
  const cnpj = value.replace(/\D/g, '');
  
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata um CPF ou CNPJ automaticamente detectando o tipo
 */
export const formatCPFOrCNPJ = (value: string | null): string => {
  if (!value) return "-";
  
  // Remove caracteres não numéricos
  const document = value.replace(/\D/g, '');
  
  if (document.length <= 11) {
    return formatCPF(document);
  } else {
    return formatCNPJ(document);
  }
};

/**
 * Formata uma entrada de texto em valor monetário para exibição
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove todos os não-dígitos, exceto vírgula
  let number = value.replace(/[^\d,]/g, '');
  
  // Se não houver valor ou apenas vírgula, retorna 0
  if (!number || number === ',') {
    return 'R$ 0,00';
  }
  
  // Substitui vírgula por ponto para processamento
  number = number.replace(',', '.');
  
  // Converte para número
  let numberValue = parseFloat(number);
  if (isNaN(numberValue)) numberValue = 0;
  
  // Formata para moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue);
};

/**
 * Extrai o valor numérico de uma string formatada como moeda
 */
export const extractNumericValue = (formattedValue: string): number => {
  // Remove símbolos de moeda e converte vírgula para ponto
  const numericString = formattedValue
    .replace(/[^\d,]/g, '')  // Remove todos exceto dígitos e vírgula
    .replace(',', '.');      // Converte vírgula para ponto
  
  const value = parseFloat(numericString);
  return isNaN(value) ? 0 : value;
};

/**
 * Formata uma entrada de telefone com a máscara
 */
export const phoneInputMask = (value: string): string => {
  const phone = value.replace(/\D/g, '');
  
  if (phone.length <= 2) {
    return phone;
  } else if (phone.length <= 6) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  } else if (phone.length <= 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  } else {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
  }
};

/**
 * Formata uma entrada de CPF/CNPJ com a máscara
 */
export const documentInputMask = (value: string): string => {
  const doc = value.replace(/\D/g, '');
  
  if (doc.length <= 3) {
    return doc;
  } else if (doc.length <= 6) {
    return `${doc.slice(0, 3)}.${doc.slice(3)}`;
  } else if (doc.length <= 9) {
    return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6)}`;
  } else if (doc.length <= 11) {
    return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6, 9)}-${doc.slice(9)}`;
  } else if (doc.length <= 12) {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8)}`;
  } else if (doc.length <= 14) {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`;
  } else {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12, 14)}`;
  }
};
