
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CreateAnnotationDialog } from '@/components/annotations/CreateAnnotationDialog';
import { AddItemToAnnotationDialog } from '@/components/annotations/AddItemToAnnotationDialog';
import { useAnnotations } from '@/contexts/AnnotationsContext';
import type { Annotation } from '@/types';
import { PlusIcon, DollarSignIcon, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function AnnotationsManagementPage() {
  const { annotations, closeAnnotation, removeItemFromAnnotation } = useAnnotations();
  const [selectedAnnotationForAddItem, setSelectedAnnotationForAddItem] = useState<Annotation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [currentPageOpen, setCurrentPageOpen] = useState(1);
  const itemsPerPageOpen = 9;
  
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const itemsPerPageClosed = 10;

  const filteredAnnotations = annotations.filter(annotation => 
    annotation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAnnotations = filteredAnnotations.filter(annotation => annotation.status === 'open');
  const closedAnnotations = filteredAnnotations.filter(annotation => annotation.status !== 'open');

  // Pagination for open annotations
  const totalPagesOpen = Math.ceil(openAnnotations.length / itemsPerPageOpen);
  const paginatedOpenAnnotations = openAnnotations.slice(
    (currentPageOpen - 1) * itemsPerPageOpen,
    currentPageOpen * itemsPerPageOpen
  );
  
  // Pagination for closed annotations
  const totalPagesClosed = Math.ceil(closedAnnotations.length / itemsPerPageClosed);
  const paginatedClosedAnnotations = closedAnnotations.slice(
    (currentPageClosed - 1) * itemsPerPageClosed,
    currentPageClosed * itemsPerPageClosed
  );

  const handleCloseAnnotation = (annotationId: string) => {
    closeAnnotation(annotationId, "Dinheiro"); // Assuming default payment for simplicity
    toast({
      title: "Anotação Fechada",
      description: `Anotação #${annotationId.substring(0,6)} foi fechada e o pagamento registrado.`,
    });
  };
  
  const handleRemoveItem = (annotationId: string, menuItemId: string, itemName: string) => {
    // Remove one item at a time
    removeItemFromAnnotation(annotationId, menuItemId, 1);
    toast({
      title: "Item Removido",
      description: `1x ${itemName} removido(s) da anotação.`,
      variant: "default",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPageOpen(1);
    setCurrentPageClosed(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Anotações de Pedidos</h1>
          <p className="text-muted-foreground">Crie, gerencie e feche as anotações dos clientes.</p>
        </div>
        <CreateAnnotationDialog />
      </header>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Anotações Abertas ({openAnnotations.length})</h2>
        </div>
        {openAnnotations.length === 0 ? (
          <p className="text-muted-foreground">{searchTerm ? `Nenhuma anotação aberta encontrada para "${searchTerm}".` : 'Nenhuma anotação aberta no momento.'}</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedOpenAnnotations.map((annotation) => (
                <Card key={annotation.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {annotation.name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                          annotation.status === 'open' ? 'bg-green-100 text-green-700' : 
                          annotation.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {annotation.status === 'open' ? 'Aberta' : annotation.status === 'paid' ? 'Paga' : 'Fechada'}
                      </span>
                    </CardTitle>
                    <CardDescription>Criada em: {(annotation.createdAt instanceof Date ? annotation.createdAt : (annotation.createdAt as any).toDate?.() || new Date(annotation.createdAt as any)).toLocaleDateString('pt-BR')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ScrollArea className="h-32">
                      {annotation.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {annotation.items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center group">
                              <span className='flex-grow pr-2'>
                                {item.quantity}x {item.menuItem.name}
                              </span>
                              <span className="font-mono text-right">
                                {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveItem(annotation.id, item.menuItem.id, item.menuItem.name)}
                                aria-label={`Remover 1 ${item.menuItem.name}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </ScrollArea>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{annotation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedAnnotationForAddItem(annotation)}>
                      <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Item
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={annotation.items.length === 0}>
                          <DollarSignIcon className="mr-2 h-4 w-4" /> Fechar Conta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Fechamento da Anotação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Anotação: {annotation.name} <br />
                            Total: {annotation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <br />
                            Esta ação irá registrar a venda e marcar a anotação como paga. Deseja continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCloseAnnotation(annotation.id)}>Confirmar Pagamento</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {totalPagesOpen > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPageOpen} de {totalPagesOpen}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageOpen(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageOpen === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageOpen(prev => Math.min(prev + 1, totalPagesOpen))}
                    disabled={currentPageOpen === totalPagesOpen}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
              </div>
            )}
          </>
        )}
      </section>
      
      {selectedAnnotationForAddItem && (
        <AddItemToAnnotationDialog
          annotation={selectedAnnotationForAddItem}
          isOpen={!!selectedAnnotationForAddItem}
          onOpenChange={(open) => {
            if (!open) setSelectedAnnotationForAddItem(null);
          }}
        />
      )}

      {closedAnnotations.length > 0 && (
        <section className="mt-8">
           <div className="flex justify-between items-center mb-3">
             <h2 className="text-xl font-semibold">Anotações Fechadas/Pagas ({closedAnnotations.length})</h2>
           </div>
          <ScrollArea className="h-64">
            <div className="space-y-3">
            {paginatedClosedAnnotations.map((annotation) => (
              <Card key={annotation.id} className="opacity-70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {annotation.name}
                     <span className={`text-xs px-2 py-1 rounded-full ${
                        annotation.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {annotation.status === 'paid' ? 'Paga' : 'Fechada'}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">Fechada em: {((annotation.closedAt || annotation.createdAt) instanceof Date ? (annotation.closedAt || annotation.createdAt) : ((annotation.closedAt || annotation.createdAt) as any).toDate?.() || new Date((annotation.closedAt || annotation.createdAt) as any)).toLocaleDateString('pt-BR')} - Total: {annotation.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            </div>
          </ScrollArea>
           {totalPagesClosed > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPageClosed} de {totalPagesClosed}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageClosed(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageClosed === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageClosed(prev => Math.min(prev + 1, totalPagesClosed))}
                    disabled={currentPageClosed === totalPagesClosed}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
