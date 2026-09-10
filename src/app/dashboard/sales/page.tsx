
"use client";

import { useState } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAnnotations } from '@/contexts/AnnotationsContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Transaction } from '@/types';
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SalesLogPage() {
  const { transactions } = useSales();
  const { getAnnotationById } = useAnnotations();
  const { getCustomerById } = useCustomers();
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewDetails = (txn: Transaction) => {
    setSelectedTxn(txn);
  };

  const filteredTransactions = transactions.filter(txn => {
    const annotation = txn.annotationId ? getAnnotationById(txn.annotationId) : null;
    const originName = annotation ? annotation.name : 'Venda Direta';
    return originName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Registro de Vendas</h1>
        <p className="text-muted-foreground">Visualize todas as transações realizadas.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Total de {filteredTransactions.length} de {transactions.length} transações encontradas.
          </CardDescription>
          <div className="relative w-full max-w-sm pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por origem (cliente, mesa...)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on new search
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma transação registrada ainda.</p>
          ) : (
            <>
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableCaption>
                  {paginatedTransactions.length > 0
                    ? `Exibindo ${paginatedTransactions.length} de ${filteredTransactions.length} vendas.`
                    : `Nenhuma venda encontrada para "${searchTerm}".`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID da Transação</TableHead>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Método de Pag.</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((txn) => {
                    const annotation = txn.annotationId ? getAnnotationById(txn.annotationId) : null;
                    const customer = annotation?.customerId ? getCustomerById(annotation.customerId) : null;
                    const originName = annotation ? annotation.name : 'Venda Direta';
                    const tag = customer?.tag || (annotation?.customerId ? 'Cursista' : null);

                    return (
                      <TableRow key={txn.id}>
                        <TableCell className="font-mono text-xs">{txn.id.substring(0, 8)}...</TableCell>
                        <TableCell>{(txn.timestamp instanceof Date ? txn.timestamp : (txn.timestamp as any).toDate?.() || new Date(txn.timestamp as any)).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-center">{txn.items.length}</TableCell>
                        <TableCell>
                          <Badge variant={txn.paymentMethod === 'Dinheiro' ? 'secondary' : 'outline'}>
                            {txn.paymentMethod || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{originName}</span>
                            {tag && (
                              <Badge variant={tag === 'Cursista' ? 'secondary' : 'default'} className="text-[11px] font-normal">
                                {tag}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{txn.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(txn)} title="Ver detalhes da transação">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
             <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {selectedTxn && (() => {
        const annotation = selectedTxn.annotationId ? getAnnotationById(selectedTxn.annotationId) : null;
        const customer = annotation?.customerId ? getCustomerById(annotation.customerId) : null;
        const tag = customer?.tag || (annotation?.customerId ? 'Cursista' : null);
        return (
          <Dialog open={!!selectedTxn} onOpenChange={(isOpen) => !isOpen && setSelectedTxn(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Detalhes da Transação</DialogTitle>
                <DialogDescription>
                  ID: <span className="font-mono text-xs">{selectedTxn.id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                 <div>
                  <h4 className="font-semibold text-sm mb-2">Resumo</h4>
                  <p className="text-sm"><strong>Data:</strong> {(selectedTxn.timestamp instanceof Date ? selectedTxn.timestamp : (selectedTxn.timestamp as any).toDate?.() || new Date(selectedTxn.timestamp as any)).toLocaleString('pt-BR')}</p>
                  <div className="text-sm flex items-center gap-2">
                    <strong>Origem:</strong> {annotation ? annotation.name : 'Venda Direta'}
                    {tag && (
                      <Badge variant={tag === 'Cursista' ? 'secondary' : 'default'} className="text-[11px]">
                        {tag}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm"><strong>Pagamento:</strong> {selectedTxn.paymentMethod}</p>
                  <p className="text-sm font-bold"><strong>Total:</strong> {selectedTxn.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Itens Comprados ({selectedTxn.items.length})</h4>
                 <ScrollArea className="h-48 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTxn.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.menuItem.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        );
      })()}

    </div>
  );
}
