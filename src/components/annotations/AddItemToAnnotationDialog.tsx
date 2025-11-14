
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useAnnotations } from '@/contexts/AnnotationsContext';
import { useMenu } from '@/contexts/MenuContext';
import type { Annotation, MenuItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddItemToAnnotationDialogProps {
  annotation: Annotation;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemToAnnotationDialog({ annotation, isOpen, onOpenChange }: AddItemToAnnotationDialogProps) {
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  const { addItemToAnnotation } = useAnnotations();
  const { menuItems } = useMenu();
  const { toast } = useToast();

  const groupedMenuItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const handleAddItem = () => {
    if (!selectedMenuItem || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um item e uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }
    addItemToAnnotation(annotation.id, selectedMenuItem, quantity);
    toast({
      title: "Item Adicionado",
      description: `${quantity}x ${selectedMenuItem.name} adicionado(s) à anotação "${annotation.name}".`,
    });
    setSelectedMenuItem(null); // Reset selection for next item
    setQuantity(1); // Reset quantity
    // onOpenChange(false); // Keep dialog open if user wants to add more items
  };

  // Reset state when dialog is closed or annotation changes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedMenuItem(null);
      setQuantity(1);
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Item à Anotação: {annotation.name}</DialogTitle>
          <DialogDescription>
            Clique em um item, defina a quantidade e adicione à anotação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row gap-4 my-4 items-end">
          <div className="flex-grow sm:flex-grow-0">
            <Label htmlFor={`quantity-dialog-${annotation.id}`}>Quantidade</Label>
            <Input
              id={`quantity-dialog-${annotation.id}`}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              min="1"
              className="w-full sm:w-24"
            />
          </div>
          <Button 
            onClick={handleAddItem} 
            disabled={!selectedMenuItem || quantity <= 0}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Selecionado
          </Button>
        </div>

        <ScrollArea className="h-[350px] border rounded-md p-3">
          {Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-background py-1 -mx-3 px-3 border-b">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {items.map(item => (
                  <Card 
                    key={item.id} 
                    onClick={() => setSelectedMenuItem(item)}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all duration-150 ease-in-out flex flex-col text-sm",
                      selectedMenuItem?.id === item.id && "ring-2 ring-primary shadow-lg"
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMenuItem(item);}}
                    aria-pressed={selectedMenuItem?.id === item.id}
                    aria-label={`Selecionar ${item.name}`}
                  >
                    <CardContent className="p-2 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      {selectedMenuItem?.id === item.id && (
                          <span className="text-xs text-primary font-semibold mt-1 self-start">Selecionado</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
