
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnnotations } from '@/contexts/AnnotationsContext';
import { PlusCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/contexts/CustomersContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CreateAnnotationDialog() {
  const [annotationName, setAnnotationName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  
  const { addAnnotation } = useAnnotations();
  const { customers } = useCustomers();
  const { toast } = useToast();

  const handleSubmit = () => {
    const isCustomerSelected = selectedCustomerId && selectedCustomerId !== 'none';
    if (!isCustomerSelected && annotationName.trim() === '') {
      toast({
        title: "Erro",
        description: "Selecione um cliente ou insira um nome para a anotação.",
        variant: "destructive",
      });
      return;
    }
    
    addAnnotation(annotationName.trim(), isCustomerSelected ? selectedCustomerId : undefined);
    
    toast({
      title: "Sucesso",
      description: `Anotação criada.`,
    });

    // Reset state and close
    setAnnotationName('');
    setSelectedCustomerId(undefined);
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setAnnotationName('');
      setSelectedCustomerId(undefined);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Anotação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Anotação</DialogTitle>
          <DialogDescription>
            Selecione um cliente existente ou digite um nome avulso para a anotação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-select" className="text-right">
              Cliente
            </Label>
             <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="none">
                    <span className="text-muted-foreground">Nenhum (anotação avulsa)</span>
                 </SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="annotation-name" className="text-right">
              Nome Avulso
            </Label>
            <Input
              id="annotation-name"
              value={annotationName}
              onChange={(e) => setAnnotationName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Mesa 5, Turma da festa"
              disabled={selectedCustomerId !== undefined && selectedCustomerId !== 'none'}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Criar Anotação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
