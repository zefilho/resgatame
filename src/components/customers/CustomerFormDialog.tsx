
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
import { useCustomers } from '@/contexts/CustomersContext';
import type { Customer } from '@/types';

interface CustomerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  phone: z.string().optional(),
});

export function CustomerFormDialog({ isOpen, onOpenChange, customer }: CustomerFormDialogProps) {
  const { addCustomer, updateCustomer } = useCustomers();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (customer) {
        form.reset({
            name: customer.name,
            phone: customer.phone || '',
        });
        } else {
        form.reset({
            name: '',
            phone: '',
        });
        }
    }
  }, [customer, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (customer) {
      await updateCustomer({ ...customer, ...values });
    } else {
      await addCustomer(values);
    }
    onOpenChange(false);
  };

  const dialogTitle = customer ? 'Editar Cliente' : 'Novo Cliente';
  const dialogDescription = customer
    ? 'Atualize as informações do cliente.'
    : 'Preencha os dados para criar um novo cliente.';

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
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(99) 99999-9999" {...field} />
                  </FormControl>
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
