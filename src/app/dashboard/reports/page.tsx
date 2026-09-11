"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSales } from "@/contexts/SalesContext";
import { useAnnotations } from "@/contexts/AnnotationsContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { Download, Package, Tag } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const { getDailyFinancialSummary, getFullItemSalesSummary, getTagSalesSummary } = useSales();
  const { annotations } = useAnnotations();
  const { getCustomerById } = useCustomers();
  const { toast } = useToast();

  const financialSummary = useMemo(() => getDailyFinancialSummary(), [getDailyFinancialSummary]);
  const itemSalesSummary = useMemo(() => getFullItemSalesSummary(), [getFullItemSalesSummary]);
  const tagSalesSummary = useMemo(() => getTagSalesSummary(), [getTagSalesSummary]);
  const openAnnotations = useMemo(() => annotations.filter(a => a.status === 'open'), [annotations]);

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação Concluída",
      description: `O arquivo ${filename} foi baixado.`,
    });
  };

  const handleExportFinancialReport = () => {
    const reportData = Object.entries(financialSummary).flatMap(([date, dailyData]) => 
      Object.entries(dailyData.methods).map(([method, amount]) => ({
        Data: date,
        MetodoPagamento: method,
        ValorTotal: (amount as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      }))
    );
    downloadCSV(reportData, 'relatorio-financeiro-detalhado.csv');
  };

  const handleExportTagSalesReport = () => {
    const reportData = tagSalesSummary.map(item => ({
      TAG_Categoria: item.tag,
      QuantidadeVendida: item.totalQuantity,
      ValorTotalVendas: item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      PorcentagemDoTotal: `${item.percentage.toFixed(1)}%`,
    }));
    downloadCSV(reportData, 'relatorio-vendas-por-tag.csv');
  };
  
  const handleExportItemSalesReport = () => {
    const reportData = itemSalesSummary.map(item => ({
        Item: item.name,
        QuantidadeVendida: item.quantity,
      }));
    downloadCSV(reportData, 'relatorio-itens-vendidos.csv');
  };

  const handleExportUnpaidAnnotations = () => {
    const reportData = openAnnotations.map(annotation => {
      const customer = annotation.customerId ? getCustomerById(annotation.customerId) : undefined;
      return {
        id_anotacao: annotation.id,
        nome: annotation.name,
        telefone: customer?.phone || 'N/A',
        data_criacao: (annotation.createdAt instanceof Date ? annotation.createdAt : (annotation.createdAt as any).toDate?.() || new Date(annotation.createdAt as any)).toLocaleString('pt-BR'),
        total_itens: annotation.items.reduce((sum, i) => sum + i.quantity, 0),
        valor_total: annotation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        itens_consumidos: annotation.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', '),
      };
    });
    downloadCSV(reportData, 'relatorio-anotacoes-abertas.csv');
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Relatórios e Exportações</h1>
        <p className="text-muted-foreground">Exporte dados financeiros, vendas por TAG, anotações em aberto e produtos vendidos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card: Vendas por TAG / Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Tag className="h-5 w-5 text-primary" />
                Vendas por TAG / Categoria
              </CardTitle>
              <CardDescription>
                Resumo do valor total de vendas e quantidade de itens acumulados por TAG (Lanchonete, Lojinha - Juventude, Lojinha - Santos Anjos, Lojinha - Apresentação).
              </CardDescription>
            </div>
            <Button onClick={handleExportTagSalesReport} disabled={tagSalesSummary.every(t => t.totalAmount === 0)} className="ml-4 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Exportar .CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tagSalesSummary.map((item) => (
                <div key={item.tag} className="p-4 rounded-lg border bg-card flex flex-col justify-between space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="font-semibold text-xs py-1 px-2 bg-primary/5">
                      {item.tag}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-primary">
                      {item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.totalQuantity} unidade(s) vendida(s)
                    </p>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${Math.max(item.percentage, item.totalAmount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG / Categoria</TableHead>
                  <TableHead className="text-center">Quantidade Vendida</TableHead>
                  <TableHead className="text-right">Representatividade (%)</TableHead>
                  <TableHead className="text-right">Valor Total (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagSalesSummary.map((item) => (
                  <TableRow key={item.tag}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{item.tag}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">{item.totalQuantity} un.</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.percentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-bold font-mono text-primary">
                      {item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Card: Relatório Financeiro por Dia */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-grow">
              <CardTitle>Relatório Financeiro por Dia</CardTitle>
              <CardDescription>Visualize o total de vendas diário, agrupado por método de pagamento.</CardDescription>
            </div>
            <Button onClick={handleExportFinancialReport} disabled={Object.keys(financialSummary).length === 0} className="ml-4 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Exportar .CSV
            </Button>
          </CardHeader>
          <CardContent>
            {Object.keys(financialSummary).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda registrada.</p>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {Object.entries(financialSummary).map(([date, dailyData]) => (
                        <AccordionItem value={date} key={date}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span className="font-medium">{date}</span>
                                    <span className="font-bold text-primary">{dailyData.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Método de Pagamento</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(dailyData.methods).map(([method, amount]) => (
                                            <TableRow key={method}>
                                                <TableCell><Badge variant="secondary">{method}</Badge></TableCell>
                                                <TableCell className="text-right font-mono">{(amount as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
          </CardContent>
        </Card>
        
        {/* Card: Anotações em Aberto */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-grow">
              <CardTitle>Anotações em Aberto</CardTitle>
              <CardDescription>Visualize e exporte anotações não pagas.</CardDescription>
            </div>
             <Button onClick={handleExportUnpaidAnnotations} disabled={openAnnotations.length === 0} className="ml-4 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Exportar .CSV
            </Button>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
              Atualmente, existem <strong>{openAnnotations.length}</strong> anotação(ões) em aberto.
            </p>
            <ScrollArea className="h-80 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {openAnnotations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Nenhuma anotação em aberto.</TableCell>
                            </TableRow>
                        ) : (
                            openAnnotations.map(annotation => {
                              const customer = annotation.customerId ? getCustomerById(annotation.customerId) : undefined;
                              return (
                                <TableRow key={annotation.id}>
                                    <TableCell className="font-medium">{annotation.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{customer?.phone || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">{annotation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                </TableRow>
                              )
                            })
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Card: Relatório de Itens Vendidos */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Relatório de Itens Vendidos</CardTitle>
              <CardDescription>Quantidades totais de cada item vendido (todo o período).</CardDescription>
            </div>
             <Button onClick={handleExportItemSalesReport} disabled={itemSalesSummary.length === 0} className="ml-4 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Exportar .CSV
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right w-[150px]">Quantidade Vendida</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {itemSalesSummary.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">Nenhuma venda registrada.</TableCell>
                            </TableRow>
                        ) : (
                            itemSalesSummary.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right font-mono">{item.quantity} unidades</TableCell>
                                </TableRow>
                              )
                            )
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
