"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSales } from "@/contexts/SalesContext";
import { useAnnotations } from "@/contexts/AnnotationsContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { Download, Package, Tag, CalendarClock, DollarSign, TrendingUp, CheckCircle2, Clock, Search, X } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const { getDailyFinancialSummary, getFullItemSalesSummary, getTagSalesSummary, getReceivablesOverview } = useSales();
  const { annotations } = useAnnotations();
  const { getCustomerById } = useCustomers();
  const { toast } = useToast();

  // Filter states for Agenda Detalhada de Parcelas
  const [receivablesSearchQuery, setReceivablesSearchQuery] = useState<string>('');
  const [receivablesDateFilter, setReceivablesDateFilter] = useState<string>('');
  const [receivablesStatusFilter, setReceivablesStatusFilter] = useState<string>('all');

  const financialSummary = useMemo(() => getDailyFinancialSummary(), [getDailyFinancialSummary]);
  const itemSalesSummary = useMemo(() => getFullItemSalesSummary(), [getFullItemSalesSummary]);
  const tagSalesSummary = useMemo(() => getTagSalesSummary(), [getTagSalesSummary]);
  const receivablesOverview = useMemo(() => getReceivablesOverview(), [getReceivablesOverview]);
  const openAnnotations = useMemo(() => annotations.filter(a => a.status === 'open'), [annotations]);

  const filteredReceivablesList = useMemo(() => {
    return receivablesOverview.receivablesList.filter((item) => {
      // 1. Text search filter
      if (receivablesSearchQuery.trim()) {
        const q = receivablesSearchQuery.toLowerCase();
        const saleDateStr = item.saleDate.toLocaleDateString('pt-BR');
        const depositDateStr = item.expectedDepositDate.toLocaleDateString('pt-BR');
        const methodStr = item.paymentMethod.toLowerCase();
        const labelStr = item.installmentLabel.toLowerCase();
        const statusStr = item.status.toLowerCase();
        const amountStr = item.amount.toFixed(2);

        const matchesText =
          saleDateStr.includes(q) ||
          depositDateStr.includes(q) ||
          methodStr.includes(q) ||
          labelStr.includes(q) ||
          statusStr.includes(q) ||
          amountStr.includes(q);

        if (!matchesText) return false;
      }

      // 2. Specific Date filter (yyyy-mm-dd from <input type="date">)
      if (receivablesDateFilter) {
        const itemDepositYmd = item.expectedDepositDate.toISOString().slice(0, 10);
        const itemSaleYmd = item.saleDate.toISOString().slice(0, 10);
        if (itemDepositYmd !== receivablesDateFilter && itemSaleYmd !== receivablesDateFilter) {
          return false;
        }
      }

      // 3. Status filter
      if (receivablesStatusFilter !== 'all') {
        if (item.status !== receivablesStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [receivablesOverview.receivablesList, receivablesSearchQuery, receivablesDateFilter, receivablesStatusFilter]);

  const filteredTotalAmount = useMemo(() => {
    return filteredReceivablesList.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredReceivablesList]);

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

  const handleExportReceivablesReport = () => {
    const reportData = filteredReceivablesList.map(item => ({
      ID_Venda: item.transactionId.substring(0, 8),
      DataVenda: item.saleDate.toLocaleDateString('pt-BR'),
      FormaPagamento: item.paymentMethod,
      Parcela: item.installmentLabel,
      PrevisaoEntradaCaixa: item.expectedDepositDate.toLocaleDateString('pt-BR'),
      ValorParcela: item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      Status: item.status,
    }));
    downloadCSV(reportData, 'relatorio-controle-recebiveis.csv');
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
        <p className="text-muted-foreground">Acompanhe a projeção de recebíveis, vendas por TAG, entradas financeiras e exportações.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card: Controle de Recebíveis (Parcelamentos & Entrada no Caixa) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-xl font-headline">
                <CalendarClock className="h-6 w-6 text-primary" />
                Controle de Recebíveis & Previsão de Caixa
              </CardTitle>
              <CardDescription>
                Acompanhe quando as vendas (à vista, débito e parceladas no cartão) se converterão em dinheiro no caixa da loja.
              </CardDescription>
            </div>
            <Button onClick={handleExportReceivablesReport} disabled={filteredReceivablesList.length === 0} className="ml-4 shrink-0">
              <Download className="mr-2 h-4 w-4" />
              Exportar .CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPI Cards de Recebíveis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Caixa Imediato (D+0 / D+1)</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-green-600">
                  {receivablesOverview.immediateRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[11px] text-muted-foreground">Dinheiro, PIX e Débitos já liberados</p>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>A Receber em 30 Dias</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-600">
                  {receivablesOverview.upcoming30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[11px] text-muted-foreground">Parcelas/Crédito para o mês atual</p>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Futuro (&gt; 30 Dias)</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-blue-600">
                  {receivablesOverview.futureBeyond30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[11px] text-muted-foreground">Parcelas a cair em 60+ dias</p>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1 shadow-sm bg-primary/5">
                <div className="flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Total Futuro A Receber</span>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-primary">
                  {receivablesOverview.totalFutureReceivables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[11px] text-muted-foreground">Soma de todas as parcelas pendentes</p>
              </div>
            </div>

            {/* Cronograma Mensal de Recebimento */}
            {receivablesOverview.monthlySchedule.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Cronograma Mensal de Entradas no Caixa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {receivablesOverview.monthlySchedule.map((m) => (
                    <div key={m.monthYear} className="p-3 rounded-md border bg-muted/30 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold block">{m.monthYear}</span>
                        <span className="text-xs text-muted-foreground">{m.count} parcela(s) / lançamentos</span>
                      </div>
                      <span className="font-bold font-mono text-primary text-base">
                        {m.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela Detalhada de Recebíveis por Parcela */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h3 className="text-base font-semibold">Agenda Detalhada de Parcelas</h3>
                <div className="text-xs text-muted-foreground font-mono">
                  Exibindo <span className="font-bold text-foreground">{filteredReceivablesList.length}</span> de <span className="font-bold text-foreground">{receivablesOverview.receivablesList.length}</span> parcelas (Total: <span className="font-bold text-primary">{filteredTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>)
                </div>
              </div>

              {/* Filtros da Agenda */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg border">
                <div className="relative col-span-1 md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filtrar por data (ex: 15/09), cartão, parcela ou valor..."
                    value={receivablesSearchQuery}
                    onChange={(e) => setReceivablesSearchQuery(e.target.value)}
                    className="pl-8 text-xs sm:text-sm"
                  />
                  {receivablesSearchQuery && (
                    <button
                      onClick={() => setReceivablesSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type="date"
                    value={receivablesDateFilter}
                    onChange={(e) => setReceivablesDateFilter(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={receivablesStatusFilter} onValueChange={setReceivablesStatusFilter}>
                    <SelectTrigger className="text-xs sm:text-sm w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="A Receber">A Receber</SelectItem>
                      <SelectItem value="Recebido">Recebido</SelectItem>
                    </SelectContent>
                  </Select>

                  {(receivablesSearchQuery || receivablesDateFilter || receivablesStatusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setReceivablesSearchQuery('');
                        setReceivablesDateFilter('');
                        setReceivablesStatusFilter('all');
                      }}
                      title="Limpar Filtros"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabela de Resultados */}
              <ScrollArea className="h-72 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data da Venda</TableHead>
                      <TableHead>Forma de Pagamento</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Previsão no Caixa</TableHead>
                      <TableHead className="text-right">Valor da Parcela</TableHead>
                      <TableHead className="text-center w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivablesList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          Nenhuma parcela encontrada com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReceivablesList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">
                            {item.saleDate.toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {item.paymentMethod}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <Badge variant="outline">{item.installmentLabel}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            {item.expectedDepositDate.toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm">
                            {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.status === 'Recebido' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                Recebido
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                A Receber
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

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
