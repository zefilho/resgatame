export type CardBrandId = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard';

export type PaymentModality = 'debito' | 'credito_vista' | 'credito_parcelado';

export interface CardBrandInfo {
  id: CardBrandId;
  name: string;
  supportsDebit: boolean;
  color: string;
}

export interface BrandRateConfig {
  brandId: CardBrandId;
  supportsDebit: boolean;
  debitRate: number; // percentage, e.g. 1.99
  credit1xRate: number; // percentage, e.g. 3.19
  // Installment rates map: installment number -> rate percentage
  // e.g. { 2: 4.50, 3: 5.20, ... 12: 12.80 }
  installmentRates: Record<number, number>;
}

export interface SimulationInput {
  netAmount: number; // Valor base desejado da venda
  brandId: CardBrandId | '';
  modality: PaymentModality;
  installments?: number; // 1 for debit/credit 1x, or 2..MAX_INSTALLMENTS for credit_parcelado
}

export interface SimulationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  netAmount: number; // Valor base líquido desejado
  grossAmount: number; // Valor total cobrado no cartão (com taxa repassada)
  feeAmount: number; // Valor total da taxa cobrada (grossAmount - netAmount)
  feePercentage: number; // Taxa % aplicada
  installments: number; // Número de parcelas
  installmentValue: number; // Valor de cada parcela (grossAmount / installments)
  brandName: string;
  modalityLabel: string;
}
