
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMenu } from '@/contexts/MenuContext';
import type { MenuItem } from '@/types';

interface ItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  price: z.coerce.number().positive({ message: "O preço deve ser um número positivo." }),
  category: z.enum(['Lanchonete', 'Lojinha'], { required_error: "A categoria é obrigatória." }),
});

export function ItemFormDialog({ isOpen, onOpenChange, item }: ItemFormDialogProps) {
  const { addMenuItem, updateMenuItem } = useMenu();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      category: 'Lanchonete',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        form.reset({
          name: item.name,
          price: item.price,
          category: item.category,
        });
      } else {
        form.reset({
          name: '',
          price: 0,
          category: 'Lanchonete',
        });
      }
    }
  }, [item, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (item) {
      await updateMenuItem({ ...item, ...values });
    } else {
      await addMenuItem(values);
    }
    onOpenChange(false);
  };

  const dialogTitle = item ? 'Editar Item' : 'Novo Item';
  const dialogDescription = item
    ? 'Atualize as informações do item.'
    : 'Preencha os dados para criar um novo item.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Coxinha de Frango" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="5.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria/Tag</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Lanchonete">Lanchonete</SelectItem>
                      <SelectItem value="Lojinha">Lojinha</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
