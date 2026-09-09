"use client";

import React from 'react';
import { InstallmentSimulatorCard } from '@/components/payments/InstallmentSimulatorCard';
import { RateTableCard } from '@/components/payments/RateTableCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Table as TableIcon, CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          Taxas & Simulador de Cartão
        </h1>
        <p className="text-muted-foreground">
          Gerencie as alíquotas da sua máquina de cartão e simule os valores de repasse de taxa por parcela.
        </p>
      </header>

      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Simulador de Parcelamento
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Tabela de Taxas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="mt-4">
          <InstallmentSimulatorCard initialAmount={100} />
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <RateTableCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
