import {
  CardBrandId,
  CardBrandInfo,
  BrandRateConfig,
  PaymentModality,
  SimulationInput,
  SimulationResult,
} from '@/types/fees';

export const MAX_INSTALLMENTS = 12;

export const SUPPORTED_BRANDS: CardBrandInfo[] = [
  { id: 'visa', name: 'Visa', supportsDebit: true, color: '#1A1F71' },
  { id: 'mastercard', name: 'Mastercard', supportsDebit: true, color: '#EB001B' },
  { id: 'elo', name: 'Elo', supportsDebit: true, color: '#00A4E4' },
  { id: 'amex', name: 'American Express', supportsDebit: false, color: '#2E77BC' },
  { id: 'hipercard', name: 'Hipercard', supportsDebit: true, color: '#B3131B' },
];

export const DEFAULT_BRAND_RATES: Record<CardBrandId, BrandRateConfig> = {
  visa: {
    brandId: 'visa',
    supportsDebit: true,
    debitRate: 1.49,
    credit1xRate: 2.99,
    installmentRates: {
      2: 4.19,
      3: 4.89,
      4: 5.59,
      5: 6.29,
      6: 6.99,
      7: 7.89,
      8: 8.59,
      9: 9.29,
      10: 9.99,
      11: 10.69,
      12: 11.39,
    },
  },
  mastercard: {
    brandId: 'mastercard',
    supportsDebit: true,
    debitRate: 1.49,
    credit1xRate: 2.99,
    installmentRates: {
      2: 4.19,
      3: 4.89,
      4: 5.59,
      5: 6.29,
      6: 6.99,
      7: 7.89,
      8: 8.59,
      9: 9.29,
      10: 9.99,
      11: 10.69,
      12: 11.39,
    },
  },
  elo: {
    brandId: 'elo',
    supportsDebit: true,
    debitRate: 1.99,
    credit1xRate: 3.49,
    installmentRates: {
      2: 4.79,
      3: 5.49,
      4: 6.19,
      5: 6.89,
      6: 7.59,
      7: 8.49,
      8: 9.19,
      9: 9.89,
      10: 10.59,
      11: 11.29,
      12: 11.99,
    },
  },
  amex: {
    brandId: 'amex',
    supportsDebit: false,
    debitRate: 0,
    credit1xRate: 3.89,
    installmentRates: {
      2: 5.29,
      3: 5.99,
      4: 6.69,
      5: 7.39,
      6: 8.09,
      7: 8.99,
      8: 9.69,
      9: 10.39,
      10: 11.09,
      11: 11.79,
      12: 12.49,
    },
  },
  hipercard: {
    brandId: 'hipercard',
    supportsDebit: true,
    debitRate: 1.89,
    credit1xRate: 3.39,
    installmentRates: {
      2: 4.69,
      3: 5.39,
      4: 6.09,
      5: 6.79,
      6: 7.49,
      7: 8.39,
      8: 9.09,
      9: 9.79,
      10: 10.49,
      11: 11.19,
      12: 11.89,
    },
  },
};

/**
 * Fee Pass-Through Formula:
 * T = V / (1 - r)
 * Where:
 * V = net desired amount
 * r = rate percentage as decimal (e.g., 3.5% -> 0.035)
 * T = gross amount to charge on card
 */
export function calculateFeePassThrough(netAmount: number, ratePercentage: number): {
  grossAmount: number;
  feeAmount: number;
} {
  if (netAmount <= 0) {
    return { grossAmount: 0, feeAmount: 0 };
  }
  const r = ratePercentage / 100;
  if (r >= 1) {
    return { grossAmount: netAmount, feeAmount: 0 };
  }

  const grossAmount = Math.round((netAmount / (1 - r)) * 100) / 100;
  const feeAmount = Math.round((grossAmount - netAmount) * 100) / 100;

  return { grossAmount, feeAmount };
}

export function getBrandInfo(brandId: CardBrandId | string): CardBrandInfo | undefined {
  return SUPPORTED_BRANDS.find((b) => b.id === brandId);
}

export function getBrandRates(brandId: CardBrandId | string): BrandRateConfig | undefined {
  return DEFAULT_BRAND_RATES[brandId as CardBrandId];
}

export function simulateInstallment(
  input: SimulationInput,
  ratesTable: Record<CardBrandId, BrandRateConfig> = DEFAULT_BRAND_RATES
): SimulationResult {
  const { netAmount, brandId, modality } = input;
  const numInstallments = input.installments && input.installments > 0 ? input.installments : 1;

  // Rule 1: Sale amount > 0
  if (netAmount <= 0) {
    return {
      isValid: false,
      errorMessage: 'Informe um valor de venda maior que zero (R$ 0,00) para realizar a simulação.',
      netAmount: 0,
      grossAmount: 0,
      feeAmount: 0,
      feePercentage: 0,
      installments: 1,
      installmentValue: 0,
      brandName: '',
      modalityLabel: '',
    };
  }

  // Rule 2: Brand must be selected
  if (!brandId) {
    return {
      isValid: false,
      errorMessage: 'Selecione uma bandeira de cartão válida para calcular as taxas.',
      netAmount,
      grossAmount: 0,
      feeAmount: 0,
      feePercentage: 0,
      installments: 1,
      installmentValue: 0,
      brandName: '',
      modalityLabel: '',
    };
  }

  const brandInfo = getBrandInfo(brandId);
  const brandRates = ratesTable[brandId];
  const brandName = brandInfo ? brandInfo.name : brandId;

  if (!brandRates) {
    return {
      isValid: false,
      errorMessage: `Taxas não encontradas para a bandeira ${brandName}.`,
      netAmount,
      grossAmount: 0,
      feeAmount: 0,
      feePercentage: 0,
      installments: 1,
      installmentValue: 0,
      brandName,
      modalityLabel: '',
    };
  }

  // Rule 3: Debit validation
  if (modality === 'debito') {
    if (!brandRates.supportsDebit || brandRates.debitRate <= 0) {
      return {
        isValid: false,
        warningMessage: `A bandeira ${brandName} não possui suporte ou taxa cadastrada para transações no Débito. Por favor, selecione Crédito ou outra bandeira.`,
        netAmount,
        grossAmount: 0,
        feeAmount: 0,
        feePercentage: 0,
        installments: 1,
        installmentValue: 0,
        brandName,
        modalityLabel: 'Débito',
      };
    }
  }

  // Determine applicable rate percentage & installments
  let feePercentage = 0;
  let effectiveInstallments = 1;
  let modalityLabel = '';

  if (modality === 'debito') {
    feePercentage = brandRates.debitRate;
    effectiveInstallments = 1;
    modalityLabel = 'Débito';
  } else if (modality === 'credito_vista') {
    feePercentage = brandRates.credit1xRate;
    effectiveInstallments = 1;
    modalityLabel = 'Crédito à Vista (1x)';
  } else if (modality === 'credito_parcelado') {
    effectiveInstallments = Math.max(2, Math.min(numInstallments, MAX_INSTALLMENTS));
    feePercentage = brandRates.installmentRates[effectiveInstallments] || brandRates.credit1xRate;
    modalityLabel = `Crédito Parcelado (${effectiveInstallments}x)`;
  }

  const { grossAmount, feeAmount } = calculateFeePassThrough(netAmount, feePercentage);
  const installmentValue = Math.round((grossAmount / effectiveInstallments) * 100) / 100;

  return {
    isValid: true,
    netAmount,
    grossAmount,
    feeAmount,
    feePercentage,
    installments: effectiveInstallments,
    installmentValue,
    brandName,
    modalityLabel,
  };
}
