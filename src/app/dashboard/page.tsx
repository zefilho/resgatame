
"use client";

import { useState } from 'react';
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSales } from "@/contexts/SalesContext";
import { DollarSign, ShoppingBag, BarChartBig, Package, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Period } from '@/contexts/SalesContext';

export default function DashboardOverviewPage() {
  const [period, setPeriod] = useState<Period>('today');
  const { getStatsForPeriod, getItemSalesSummaryForPeriod, getPaymentMethodSummaryForPeriod } = useSales();

  const { revenue, totalOrders, averageOrderValue } = getStatsForPeriod(period);
  const itemSummary = getItemSalesSummaryForPeriod(period);
  const paymentSummary = getPaymentMethodSummaryForPeriod(period);
  
  const periodLabel = period === 'last20days' ? 'Últimos 20 dias' : 'Hoje';

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe as métricas chave do seu Snack Bar.</p>
      </header>

      <Tabs 
        value={period} 
        onValueChange={(value) => setPeriod(value as Period)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="last20days">Últimos 20 Dias</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 col-span-3">
            <StatCard
              title="Receita no Período"
              value={revenue}
              icon={DollarSign}
              description={`Total de vendas para: ${periodLabel}.`}
            />
            <StatCard
              title="Total de Pedidos"
              value={totalOrders}
              icon={ShoppingBag}
              description={`Número de pedidos para: ${periodLabel}.`}
            />
            <StatCard
              title="Valor Médio por Pedido"
              value={averageOrderValue}
              icon={BarChartBig}
              description={`Valor médio de pedido para: ${periodLabel}.`}
            />
          </div>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens Vendidos no Período
              </CardTitle>
              <CardDescription>
                {`Itens vendidos para: ${periodLabel}, ordenados alfabeticamente.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemSummary.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum item vendido no período selecionado.</p>
              ) : (
                <ScrollArea className="h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right w-[150px]">Quantidade Vendida</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemSummary.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right font-mono">{item.quantity} unidades</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
             <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Vendas por Pagamento
              </CardTitle>
              <CardDescription>
                {`Resumo por método para: ${periodLabel}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {paymentSummary.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma venda registrada no período.</p>
              ) : (
                <ScrollArea className="h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSummary.map((summary) => (
                        <TableRow key={summary.method}>
                          <TableCell className="font-medium">{summary.method}</TableCell>
                          <TableCell className="text-right font-mono">
                            {summary.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
