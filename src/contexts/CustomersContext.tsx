
"use client";

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/firebase/client';

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getCustomerById: (customerId: string) => Customer | undefined;
  isLoading: boolean;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const customersCollection = collection(db, 'customers');
    const q = query(customersCollection, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
      setCustomers(customersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching customers: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id'>) => {
    try {
      const customersCollection = collection(db, 'customers');
      await addDoc(customersCollection, customerData);
      toast({ title: 'Sucesso', description: 'Cliente adicionado com sucesso.' });
    } catch (error) {
      console.error("Error adding customer: ", error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o cliente.', variant: 'destructive' });
    }
  }, [toast]);

  const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
    try {
      const customerDoc = doc(db, 'customers', updatedCustomer.id);
      const { id, ...customerData } = updatedCustomer;
      await updateDoc(customerDoc, customerData);
      toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso.' });
    } catch (error) {
      console.error("Error updating customer: ", error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o cliente.', variant: 'destructive' });
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      const customerDoc = doc(db, 'customers', customerId);
      await deleteDoc(customerDoc);
      toast({ title: 'Sucesso', description: 'Cliente deletado com sucesso.' });
    } catch (error) {
      console.error("Error deleting customer: ", error);
      toast({ title: 'Erro', description: 'Não foi possível deletar o cliente.', variant: 'destructive' });
    }
  }, [toast]);
  
  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId);
  }, [customers]);

  const value = useMemo(() => ({
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    isLoading,
  }), [customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById, isLoading]);

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = (): CustomersContextType => {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
};
