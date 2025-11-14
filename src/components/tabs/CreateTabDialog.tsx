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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTabs } from '@/contexts/TabsContext';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CreateTabDialog() {
  const [tabName, setTabName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { addTab } = useTabs();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (tabName.trim() === '') {
      toast({
        title: "Erro",
        description: "O nome da aba não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    addTab(tabName.trim());
    toast({
      title: "Sucesso",
      description: `Aba "${tabName.trim()}" criada.`,
    });
    setTabName('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Aba
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Aba</DialogTitle>
          <DialogDescription>
            Insira um nome para a nova aba (ex: Mesa 5, Cliente Ana).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tab-name" className="text-right">
              Nome
            </Label>
            <Input
              id="tab-name"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              className="col-span-3"
              placeholder="Nome da Aba"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Criar Aba</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
