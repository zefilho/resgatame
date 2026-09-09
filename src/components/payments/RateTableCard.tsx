"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUPPORTED_BRANDS, DEFAULT_BRAND_RATES, MAX_INSTALLMENTS } from '@/lib/fees_service';
import { CreditCard, Table as TableIcon } from 'lucide-react';

export function RateTableCard({ className = '' }: { className?: string }) {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  return (
    <Card className={`w-full border shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-primary font-headline">
          <TableIcon className="h-5 w-5 text-primary" />
          Tabela de Taxas da Máquina de Cartão
        </CardTitle>
        <CardDescription>
          Consulte as alíquotas de débito, crédito à vista e parcelado por bandeira de cartão.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="all" value={selectedBrand} onValueChange={setSelectedBrand}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs">
              Todas as Bandeiras
            </TabsTrigger>
            {SUPPORTED_BRANDS.map((b) => (
              <TabsTrigger key={b.id} value={b.id} className="text-xs">
                {b.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[140px] font-semibold">Bandeira</TableHead>
                    <TableHead className="font-semibold text-center">Débito</TableHead>
                    <TableHead className="font-semibold text-center">Crédito 1x</TableHead>
                    <TableHead className="font-semibold text-center">2x a 3x</TableHead>
                    <TableHead className="font-semibold text-center">4x a 6x</TableHead>
                    <TableHead className="font-semibold text-center">7x a 12x</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUPPORTED_BRANDS.map((brand) => {
                    const rates = DEFAULT_BRAND_RATES[brand.id];
                    if (!rates) return null;

                    return (
                      <TableRow key={brand.id}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {brand.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {rates.supportsDebit ? (
                            <Badge variant="secondary" className="font-mono">
                              {rates.debitRate.toFixed(2)}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground bg-muted/40 text-[11px]">
                              Não suportado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          <Badge variant="outline" className="font-mono border-primary/30">
                            {rates.credit1xRate.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {rates.installmentRates[2].toFixed(2)}% - {rates.installmentRates[3].toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {rates.installmentRates[4].toFixed(2)}% - {rates.installmentRates[6].toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {rates.installmentRates[7].toFixed(2)}% - {rates.installmentRates[12].toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {SUPPORTED_BRANDS.map((brand) => {
            const rates = DEFAULT_BRAND_RATES[brand.id];
            if (!rates) return null;

            return (
              <TabsContent key={brand.id} value={brand.id} className="mt-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Modalidade / Parcela</TableHead>
                        <TableHead className="font-semibold text-right">Taxa Aplicada (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Débito à Vista</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {rates.supportsDebit ? (
                            `${rates.debitRate.toFixed(2)}%`
                          ) : (
                            <span className="text-muted-foreground text-xs italic">N/A (Sem Suporte)</span>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Crédito à Vista (1x)</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {rates.credit1xRate.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      {Array.from({ length: MAX_INSTALLMENTS - 1 }, (_, i) => i + 2).map((n) => (
                        <TableRow key={n}>
                          <TableCell className="font-medium">Crédito Parcelado {n}x</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {(rates.installmentRates[n] || 0).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
