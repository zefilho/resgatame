"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstallmentSimulatorCard } from '@/components/payments/InstallmentSimulatorCard';
import type { Annotation } from '@/types';
import type { SimulationResult } from '@/types/fees';
import { DollarSign, CreditCard, Banknote, QrCode, Split, CheckCircle2, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface PaymentSplitItem {
  id: string;
  method: 'Dinheiro' | 'PIX' | 'Cartao';
  amount: number;
  simulation?: SimulationResult;
}

interface CloseAccountDialogProps {
  account: Annotation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: (accountId: string, paymentMethodSummary: string) => void;
}

export function CloseAccountDialog({
  account,
  isOpen,
  onOpenChange,
  onConfirmPayment,
}: CloseAccountDialogProps) {
  const [paymentType, setPaymentType] = useState<'single' | 'split'>('single');
  
  // Single payment state
  const [singleMethod, setSingleMethod] = useState<'Dinheiro' | 'PIX' | 'Cartao'>('Dinheiro');
  const [cardSimulation, setCardSimulation] = useState<SimulationResult | null>(null);

  // Split payment state
  const [splits, setSplits] = useState<PaymentSplitItem[]>([]);
  const [splitMethod, setSplitMethod] = useState<'Dinheiro' | 'PIX' | 'Cartao'>('Dinheiro');
  const [splitAmount, setSplitAmount] = useState<number>(0);
  const [splitCardSimulation, setSplitCardSimulation] = useState<SimulationResult | null>(null);

  if (!account) return null;

  const totalBill = account.totalAmount;

  // Calculate split totals
  const totalPaidInSplits = splits.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = Math.max(0, Math.round((totalBill - totalPaidInSplits) * 100) / 100);

  const handleAddSplit = () => {
    if (splitAmount <= 0 || splitAmount > remainingBalance) return;
    if (splitMethod === 'Cartao' && splitCardSimulation && !splitCardSimulation.isValid) return;

    const newSplit: PaymentSplitItem = {
      id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      method: splitMethod,
      amount: splitAmount,
      simulation: splitMethod === 'Cartao' ? splitCardSimulation || undefined : undefined,
    };

    const nextSplits = [...splits, newSplit];
    setSplits(nextSplits);

    // Reset split input
    const nextPaid = nextSplits.reduce((sum, item) => sum + item.amount, 0);
    const nextRemaining = Math.max(0, Math.round((totalBill - nextPaid) * 100) / 100);
    setSplitAmount(nextRemaining);
  };

  const handleRemoveSplit = (id: string) => {
    const nextSplits = splits.filter(s => s.id !== id);
    setSplits(nextSplits);
    const nextPaid = nextSplits.reduce((sum, item) => sum + item.amount, 0);
    const nextRemaining = Math.max(0, Math.round((totalBill - nextPaid) * 100) / 100);
    setSplitAmount(nextRemaining);
  };

  const handleConfirm = () => {
    let summary = '';

    if (paymentType === 'single') {
      if (singleMethod === 'Cartao' && cardSimulation && cardSimulation.isValid) {
        summary = `Cartão ${cardSimulation.brandName} (${cardSimulation.modalityLabel}) - Total: ${cardSimulation.grossAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      } else {
        summary = singleMethod;
      }
    } else {
      // Split payment summary
      const parts = splits.map(s => {
        if (s.method === 'Cartao' && s.simulation) {
          return `${s.simulation.brandName} ${s.simulation.modalityLabel} (${s.simulation.grossAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
        }
        return `${s.method} (${s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
      });
      summary = `Pagamento Fracionado: ${parts.join(' + ')}`;
    }

    onConfirmPayment(account.id, summary);
    onOpenChange(false);
  };

  const isSingleValid = singleMethod !== 'Cartao' || (cardSimulation && cardSimulation.isValid);
  const isSplitValid = splits.length > 0 && remainingBalance === 0;
  const canConfirm = paymentType === 'single' ? isSingleValid : isSplitValid;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between font-headline">
            <span className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Fechar Conta & Pagamento
            </span>
            <Badge variant="outline" className="text-sm font-mono px-3 py-1">
              Total: {totalBill.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Cliente/Aba: <span className="font-semibold text-foreground">{account.name}</span> (#{account.id.substring(0, 8)})
          </DialogDescription>
        </DialogHeader>

        {/* Resumo de itens */}
        <div className="bg-muted/40 rounded-lg p-3 border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Consumo ({account.items.length} itens)
          </span>
          <ScrollArea className="h-24">
            <ul className="text-sm space-y-1">
              {account.items.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center text-muted-foreground">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span className="font-mono">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <Tabs value={paymentType} onValueChange={(val) => setPaymentType(val as 'single' | 'split')} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Pagamento Único
            </TabsTrigger>
            <TabsTrigger value="split" className="flex items-center gap-2">
              <Split className="h-4 w-4" />
              Separação de Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PAGAMENTO ÚNICO */}
          <TabsContent value="single" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Selecione o Forma de Pagamento</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={singleMethod === 'Dinheiro' ? 'default' : 'outline'}
                  className="flex flex-col h-16 justify-center gap-1"
                  onClick={() => setSingleMethod('Dinheiro')}
                >
                  <Banknote className="h-5 w-5" />
                  <span>Dinheiro</span>
                </Button>
                <Button
                  type="button"
                  variant={singleMethod === 'PIX' ? 'default' : 'outline'}
                  className="flex flex-col h-16 justify-center gap-1"
                  onClick={() => setSingleMethod('PIX')}
                >
                  <QrCode className="h-5 w-5" />
                  <span>PIX</span>
                </Button>
                <Button
                  type="button"
                  variant={singleMethod === 'Cartao' ? 'default' : 'outline'}
                  className="flex flex-col h-16 justify-center gap-1"
                  onClick={() => setSingleMethod('Cartao')}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Cartão</span>
                </Button>
              </div>
            </div>

            {/* Simulador de Cartão para Pagamento Único */}
            {singleMethod === 'Cartao' && (
              <InstallmentSimulatorCard
                initialAmount={totalBill}
                readOnlyAmount={true}
                onSimulationChange={setCardSimulation}
              />
            )}
          </TabsContent>

          {/* TAB 2: SEPARAÇÃO DE PAGAMENTOS (PAGAMENTO FRACIONADO) */}
          <TabsContent value="split" className="space-y-4 pt-3">
            {/* Status da Divisão */}
            <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border text-center text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Total da Conta</span>
                <span className="font-bold font-mono text-base">{totalBill.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Total Lançado</span>
                <span className="font-bold font-mono text-base text-green-600">{totalPaidInSplits.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Restante</span>
                <span className={`font-bold font-mono text-base ${remainingBalance > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Form de adição de fração */}
            {remainingBalance > 0 ? (
              <div className="border p-4 rounded-lg space-y-3 bg-card">
                <span className="text-sm font-semibold block">Adicionar Parcela de Pagamento</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Forma de Pagamento</Label>
                    <Select value={splitMethod} onValueChange={(val) => setSplitMethod(val as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Cartao">Cartão de Crédito / Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor da Parcela (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={remainingBalance}
                      value={splitAmount || ''}
                      onChange={(e) => setSplitAmount(Math.min(remainingBalance, parseFloat(e.target.value) || 0))}
                      className="font-mono"
                    />
                  </div>
                </div>

                {splitMethod === 'Cartao' && (
                  <InstallmentSimulatorCard
                    initialAmount={splitAmount}
                    readOnlyAmount={false}
                    onSimulationChange={setSplitCardSimulation}
                  />
                )}

                <Button
                  type="button"
                  onClick={handleAddSplit}
                  disabled={splitAmount <= 0 || (splitMethod === 'Cartao' && splitCardSimulation && !splitCardSimulation.isValid)}
                  className="w-full gap-2 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Parcela ao Pagamento
                </Button>
              </div>
            ) : (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-sm font-medium">
                  Valor total da conta foi 100% distribuído entre as formas de pagamento!
                </AlertDescription>
              </Alert>
            )}

            {/* Lista de frações adicionadas */}
            {splits.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pagamentos Adicionados ({splits.length})
                </span>
                <div className="space-y-2">
                  {splits.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-2.5 rounded border bg-background text-sm">
                      <div>
                        <span className="font-semibold">{s.method}</span>
                        {s.simulation && (
                          <span className="text-xs text-muted-foreground block font-mono">
                            {s.simulation.brandName} - {s.simulation.modalityLabel} ({s.simulation.installments}x de R$ {s.simulation.installmentValue.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono">
                          {s.simulation ? s.simulation.grossAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSplit(s.id)}
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canConfirm} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmar Pagamento e Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
