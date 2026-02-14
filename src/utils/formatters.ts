
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
