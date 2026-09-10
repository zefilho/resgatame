"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMenu } from '@/contexts/MenuContext';
import { useSales } from '@/contexts/SalesContext';
import type { OrderItem, MenuItem } from '@/types';
import { ConcreteOrderItem } from '@/types';
import { PlusCircle, Trash2, DollarSign, Search, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { InstallmentSimulatorCard } from '@/components/payments/InstallmentSimulatorCard';
import type { SimulationResult } from '@/types/fees';

export default function NewOrderPage() {
  const { menuItems, isLoading: isMenuLoading } = useMenu();
  const { addTransaction } = useSales();
  const { toast } = useToast();

  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
  const [cardSimulation, setCardSimulation] = useState<SimulationResult | null>(null);

  const orderBaseTotal = useMemo(() => {
    return currentOrderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [currentOrderItems]);

  const isCardPayment = paymentMethod === "Cartão" || paymentMethod === "Cartão de Crédito" || paymentMethod === "Cartão de Débito";

  const finalChargedTotal = useMemo(() => {
    if (isCardPayment && cardSimulation && cardSimulation.isValid) {
      return cardSimulation.grossAmount;
    }
    return orderBaseTotal;
  }, [isCardPayment, cardSimulation, orderBaseTotal]);

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [menuItems, searchQuery]);

  const groupedMenuItems = useMemo(() => {
    return filteredMenuItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [filteredMenuItems]);

  const handleAddItemToOrder = () => {
    if (!selectedMenuItem || quantity <= 0) {
      toast({ title: "Erro", description: "Selecione um item e uma quantidade válida.", variant: "destructive" });
      return;
    }
    
    const existingItemIndex = currentOrderItems.findIndex(item => item.menuItem.id === selectedMenuItem.id);
    if (existingItemIndex > -1) {
      const updatedItems = currentOrderItems.map((item, index) =>
        index === existingItemIndex
          ? new ConcreteOrderItem(selectedMenuItem, item.quantity + quantity)
          : item
      );
      setCurrentOrderItems(updatedItems);
    } else {
      setCurrentOrderItems([...currentOrderItems, new ConcreteOrderItem(selectedMenuItem, quantity)]);
    }
    setSelectedMenuItem(null);
    setQuantity(1);
    toast({ title: "Item Adicionado", description: `${selectedMenuItem.name} adicionado ao pedido.` });
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrderItems(currentOrderItems.filter(item => item.menuItem.id !== itemId));
    toast({ title: "Item Removido", variant: "default" });
  };

  const handleFinalizeOrder = async () => {
    if (currentOrderItems.length === 0) {
      toast({ title: "Erro", description: "Adicione itens ao pedido antes de finalizar.", variant: "destructive" });
      return;
    }

    if (isCardPayment && (!cardSimulation || !cardSimulation.isValid)) {
      toast({ title: "Erro no Pagamento", description: "Selecione as opções válidas da maquininha de cartão.", variant: "destructive" });
      return;
    }

    let finalPaymentMethodDesc = paymentMethod;
    if (isCardPayment && cardSimulation && cardSimulation.isValid) {
      finalPaymentMethodDesc = `Cartão ${cardSimulation.brandName} (${cardSimulation.modalityLabel}${cardSimulation.installments > 1 ? ` ${cardSimulation.installments}x` : ''})`;
    }

    try {
      await addTransaction({
        items: currentOrderItems,
        totalAmount: finalChargedTotal,
        paymentMethod: finalPaymentMethodDesc,
      });
      toast({ title: "Pedido Finalizado", description: `Venda de ${finalChargedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada com sucesso.` });
      setCurrentOrderItems([]);
      setPaymentMethod("Dinheiro");
      setSelectedMenuItem(null);
      setCardSimulation(null);
      setSearchQuery('');
    } catch (e) {
      // Error toast handled in SalesContext
    }
  };

  const canFinalize = currentOrderItems.length > 0 && (!isCardPayment || (cardSimulation && cardSimulation.isValid));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Novo Pedido / Venda Direta</h1>
        <p className="text-muted-foreground">Registre uma nova venda direta com opções completas de pagamento e repasse de taxas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu & Item Selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cardápio / Selecionar Itens</CardTitle>
            <CardDescription>Filtre ou clique em um item para selecioná-lo, ajuste a quantidade e adicione ao pedido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por nome do item ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow sm:flex-grow-0">
                <Label htmlFor="quantity-input">Quantidade</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="w-full sm:w-24"
                />
              </div>
              <Button 
                onClick={handleAddItemToOrder} 
                disabled={!selectedMenuItem || quantity <= 0}
                className="w-full sm:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Selecionado
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px] border rounded-md p-4">
              {isMenuLoading ? (
                 <div className="space-y-6">
                    <Skeleton className="h-8 w-1/3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                  </div>
              ) : Object.keys(groupedMenuItems).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum item encontrado para &quot;{searchQuery}&quot;.
                </div>
              ) : (
                Object.entries(groupedMenuItems).map(([category, items]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-xl font-semibold mb-3 sticky top-0 bg-card py-2 -mx-4 px-4 border-b">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {items.map(item => (
                        <Card 
                          key={item.id} 
                          onClick={() => setSelectedMenuItem(item)}
                          className={cn(
                            "cursor-pointer hover:shadow-lg transition-all duration-200 ease-in-out flex flex-col",
                            selectedMenuItem?.id === item.id && "ring-2 ring-primary shadow-xl scale-105"
                          )}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMenuItem(item);}}
                          aria-pressed={selectedMenuItem?.id === item.id}
                          aria-label={`Selecionar ${item.name}`}
                        >
                          <CardContent className="p-3 flex-grow flex flex-col justify-between">
                            <div>
                              <p className="font-medium text-base leading-tight">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            </div>
                            {selectedMenuItem?.id === item.id && (
                               <span className="text-xs text-primary font-semibold mt-2 self-start">Selecionado</span>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Order Summary & Payment Panel */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col space-y-4">
            <h3 className="text-lg font-semibold -mt-2 mb-2">Itens no Pedido</h3>
            {currentOrderItems.length === 0 ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center py-4">Nenhum item no pedido.</p>
              </div>
            ) : (
              <ScrollArea className="flex-grow min-h-0 max-h-56">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center w-[50px]">Qtd.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right w-[40px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrderItems.map((item) => (
                      <TableRow key={item.menuItem.id + Math.random()}>
                        <TableCell className="font-medium leading-tight py-2">
                          {item.menuItem.name}
                          <p className="text-xs text-muted-foreground">{item.menuItem.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </TableCell>
                        <TableCell className="text-center py-2">{item.quantity}</TableCell>
                        <TableCell className="text-right py-2">{item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-right py-2">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.menuItem.id)} aria-label={`Remover ${item.menuItem.name}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            
            <Separator className="my-2" />

            <div className="mt-auto space-y-4">
              <div>
                <Label htmlFor="payment-method" className="font-semibold text-sm">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method" className="mt-1">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão">Cartão (Crédito / Débito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Simulador de Taxas de Cartão */}
              {isCardPayment && (
                <div className="mt-2">
                  <InstallmentSimulatorCard
                    initialAmount={orderBaseTotal}
                    readOnlyAmount={true}
                    onSimulationChange={setCardSimulation}
                  />
                </div>
              )}

              {/* Totais do Pedido com Detalhamento de Taxas */}
              <div className="space-y-1 bg-muted/40 p-3 rounded-lg border">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal Itens:</span>
                  <span className="font-mono font-medium">{orderBaseTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {isCardPayment && cardSimulation && cardSimulation.isValid && (
                  <div className="flex justify-between items-center text-sm text-amber-700 dark:text-amber-400">
                    <span>Taxa Repassada ({cardSimulation.feePercentage.toFixed(2)}%):</span>
                    <span className="font-mono font-medium">+ {cardSimulation.feeAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                )}

                <Separator className="my-1.5" />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total Cobrado:</span>
                  <span className="font-mono text-primary">{finalChargedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button 
              className="w-full text-lg py-6" 
              onClick={handleFinalizeOrder}
              disabled={!canFinalize}
            >
              <DollarSign className="mr-2 h-5 w-5" /> Finalizar Venda
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
