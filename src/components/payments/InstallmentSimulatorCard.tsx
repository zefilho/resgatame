"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CardBrandId,
  PaymentModality,
  SimulationResult,
} from '@/types/fees';
import {
  SUPPORTED_BRANDS,
  MAX_INSTALLMENTS,
  simulateInstallment,
} from '@/lib/fees_service';
import { Calculator, AlertTriangle, CreditCard, DollarSign, Info } from 'lucide-react';

interface InstallmentSimulatorCardProps {
  initialAmount?: number;
  readOnlyAmount?: boolean;
  onSimulationChange?: (result: SimulationResult) => void;
  className?: string;
}

export function InstallmentSimulatorCard({
  initialAmount = 0,
  readOnlyAmount = false,
  onSimulationChange,
  className = '',
}: InstallmentSimulatorCardProps) {
  const [netAmount, setNetAmount] = useState<number>(initialAmount);
  const [brandId, setBrandId] = useState<CardBrandId | ''>('visa');
  const [modality, setModality] = useState<PaymentModality>('credito_vista');
  const [installments, setInstallments] = useState<number>(2);

  // Sync initialAmount if changed from parent
  useEffect(() => {
    if (initialAmount !== undefined) {
      setNetAmount(initialAmount);
    }
  }, [initialAmount]);

  const simulation = simulateInstallment({
    netAmount,
    brandId,
    modality,
    installments: modality === 'credito_parcelado' ? installments : 1,
  });

  useEffect(() => {
    if (onSimulationChange) {
      onSimulationChange(simulation);
    }
  }, [simulation.netAmount, simulation.grossAmount, simulation.brandName, simulation.modalityLabel, simulation.installments, simulation.isValid]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setNetAmount(isNaN(val) ? 0 : val);
  };

  return (
    <Card className={`w-full border shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-primary font-headline">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Parcelamento & Taxas
        </CardTitle>
        <CardDescription>
          Calcule a taxa da máquina de cartão repassada ao cliente (Fee Pass-Through).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor Base da Venda */}
          <div className="space-y-2">
            <Label htmlFor="sim-amount" className="text-sm font-semibold flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Valor Base da Venda (R$)
            </Label>
            <Input
              id="sim-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={netAmount || ''}
              onChange={handleAmountChange}
              disabled={readOnlyAmount}
              className="font-mono text-base"
            />
          </div>

          {/* Seleção da Bandeira */}
          <div className="space-y-2">
            <Label htmlFor="sim-brand" className="text-sm font-semibold flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Bandeira do Cartão
            </Label>
            <Select value={brandId} onValueChange={(val) => setBrandId(val as CardBrandId)}>
              <SelectTrigger id="sim-brand">
                <SelectValue placeholder="Selecione a bandeira..." />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_BRANDS.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{brand.name}</span>
                      {!brand.supportsDebit && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                          Sem Débito
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modalidade de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="sim-modality" className="text-sm font-semibold">
              Modalidade
            </Label>
            <Select value={modality} onValueChange={(val) => setModality(val as PaymentModality)}>
              <SelectTrigger id="sim-modality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="credito_vista">Crédito à Vista (1x)</SelectItem>
                <SelectItem value="credito_parcelado">Crédito Parcelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Seleção de Parcelas - Exibido dinamicamente APENAS no Crédito Parcelado */}
          {modality === 'credito_parcelado' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label htmlFor="sim-installments" className="text-sm font-semibold">
                Número de Parcelas
              </Label>
              <Select
                value={installments.toString()}
                onValueChange={(val) => setInstallments(parseInt(val, 10))}
              >
                <SelectTrigger id="sim-installments">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: MAX_INSTALLMENTS - 1 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x Parcelas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Warning Alert: Debit Not Supported */}
        {simulation.warningMessage && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
              Modalidade Não Suportada
            </AlertTitle>
            <AlertDescription className="text-sm mt-1 text-amber-700 dark:text-amber-200">
              {simulation.warningMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Informative State: Minimum Amount or Brand missing */}
        {!simulation.isValid && !simulation.warningMessage && (
          <Alert variant="default" className="bg-muted/50 border-muted">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-sm text-muted-foreground">
              {simulation.errorMessage || 'Informe os dados acima para realizar o cálculo das taxas.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Simulation Output Card */}
        {simulation.isValid && (
          <div className="rounded-lg border bg-card p-4 space-y-4 shadow-sm bg-amber-50/30 dark:bg-card">
            {/* Display Destaque do Valor da Parcela se parcelado > 1x */}
            {simulation.installments > 1 ? (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Valor por Parcela no Cartão
                </span>
                <div className="text-3xl font-extrabold text-primary font-headline">
                  {simulation.installments}x de{' '}
                  {simulation.installmentValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Valor Único a Cobrar no Cartão ({simulation.modalityLabel})
                </span>
                <div className="text-2xl font-bold text-primary font-headline">
                  {simulation.grossAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            )}

            {/* Financial Breakdown Details */}
            <div className="flex flex-col gap-2 text-sm pt-1">
              <div className="p-2.5 rounded bg-background border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Valor Líquido (Loja)</span>
                <span className="font-semibold text-sm font-mono">
                  {simulation.netAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="p-2.5 rounded bg-background border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Taxa da Maquininha</span>
                <Badge variant="outline" className="font-mono text-xs font-semibold">
                  {simulation.feePercentage.toFixed(2)}%
                </Badge>
              </div>

              <div className="p-2.5 rounded bg-background border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Taxa Repassada (R$)</span>
                <span className="font-semibold text-sm font-mono text-amber-700 dark:text-amber-400">
                  + {simulation.feeAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="p-2.5 rounded bg-background border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Total Bruto Cartão</span>
                <span className="font-bold text-sm font-mono text-primary">
                  {simulation.grossAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
