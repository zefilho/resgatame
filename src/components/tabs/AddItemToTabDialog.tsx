"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTabs } from '@/contexts/TabsContext';
import { useMenu } from '@/contexts/MenuContext';
import type { CustomerTab, MenuItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddItemToTabDialogProps {
  tab: CustomerTab;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemToTabDialog({ tab, isOpen, onOpenChange }: AddItemToTabDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const { addItemToTab } = useTabs();
  const { menuItems } = useMenu();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedItemId || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um item e insira uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }
    const menuItem = menuItems.find(item => item.id === selectedItemId);
    if (menuItem) {
      addItemToTab(tab.id, menuItem, quantity);
      toast({
        title: "Item Adicionado",
        description: `${quantity}x ${menuItem.name} adicionado(s) à aba "${tab.name}".`,
      });
      setSelectedItemId(undefined);
      setQuantity(1);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Item à Aba: {tab.name}</DialogTitle>
          <DialogDescription>
            Selecione um item e a quantidade para adicionar à aba.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="menu-item" className="text-right">
              Item
            </Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um item" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantidade
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Adicionar Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
