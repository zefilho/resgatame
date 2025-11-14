"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CreateTabDialog } from '@/components/tabs/CreateTabDialog';
import { AddItemToTabDialog } from '@/components/tabs/AddItemToTabDialog';
import { useTabs } from '@/contexts/TabsContext';
import type { CustomerTab } from '@/types';
import { PlusIcon, XCircleIcon, DollarSignIcon, CheckCircleIcon, PencilIcon } from 'lucide-react';
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

export default function TabsManagementPage() {
  const { tabs, closeTab } = useTabs();
  const [selectedTabForAddItem, setSelectedTabForAddItem] = useState<CustomerTab | null>(null);
  const { toast } = useToast();

  const openTabs = tabs.filter(tab => tab.status === 'open');
  const closedTabs = tabs.filter(tab => tab.status !== 'open');

  const handleCloseTab = (tabId: string) => {
    // Assuming default payment method for simplicity here, could be a select in the dialog
    closeTab(tabId, "Dinheiro"); 
    toast({
      title: "Aba Fechada",
      description: `Aba #${tabId.substring(0,6)} foi fechada e o pagamento registrado.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Gestão de Abas</h1>
          <p className="text-muted-foreground">Crie, gerencie e feche as abas dos clientes.</p>
        </div>
        <CreateTabDialog />
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-3">Abas Abertas ({openTabs.length})</h2>
        {openTabs.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma aba aberta no momento.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {openTabs.map((tab) => (
              <Card key={tab.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {tab.name}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        tab.status === 'open' ? 'bg-green-100 text-green-700' : 
                        tab.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {tab.status === 'open' ? 'Aberta' : tab.status === 'paid' ? 'Paga' : 'Fechada'}
                    </span>
                  </CardTitle>
                  <CardDescription>Criada em: {new Date(tab.createdAt).toLocaleDateString('pt-BR')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ScrollArea className="h-32">
                    {tab.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {tab.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.quantity}x {item.menuItem.name}</span>
                            <span>{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{tab.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTabForAddItem(tab)}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Item
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={tab.items.length === 0}>
                        <DollarSignIcon className="mr-2 h-4 w-4" /> Fechar Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Fechamento da Aba?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Aba: {tab.name} <br />
                          Total: {tab.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <br />
                          Esta ação irá registrar a venda e marcar a aba como paga. Deseja continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCloseTab(tab.id)}>Confirmar Pagamento</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {selectedTabForAddItem && (
        <AddItemToTabDialog
          tab={selectedTabForAddItem}
          isOpen={!!selectedTabForAddItem}
          onOpenChange={(open) => {
            if (!open) setSelectedTabForAddItem(null);
          }}
        />
      )}

      {closedTabs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Abas Fechadas/Pagas ({closedTabs.length})</h2>
          <ScrollArea className="h-64">
            <div className="space-y-3">
            {closedTabs.map((tab) => (
              <Card key={tab.id} className="opacity-70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {tab.name}
                     <span className={`text-xs px-2 py-1 rounded-full ${
                        tab.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {tab.status === 'paid' ? 'Paga' : 'Fechada'}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">Fechada em: {new Date(tab.createdAt).toLocaleDateString('pt-BR')} - Total: {tab.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            </div>
          </ScrollArea>
        </section>
      )}
    </div>
  );
}
