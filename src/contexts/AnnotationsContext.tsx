
"use client";

import type { Annotation, OrderItem, MenuItem, Customer } from '@/types';
import { ConcreteAnnotation, ConcreteOrderItem } from '@/types';
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useSales } from './SalesContext';
import { useCustomers } from './CustomersContext';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase/client';


interface AnnotationsContextType {
  annotations: Annotation[];
  addAnnotation: (name: string, customerId?: string) => Promise<Annotation | undefined>;
  addItemToAnnotation: (annotationId: string, menuItem: MenuItem, quantity: number) => Promise<void>;
  removeItemFromAnnotation: (annotationId: string, menuItemId: string, quantityToRemove: number) => Promise<void>;
  closeAnnotation: (annotationId: string, paymentMethod: string) => Promise<void>;
  getAnnotationById: (annotationId: string) => Annotation | undefined;
}

const AnnotationsContext = createContext<AnnotationsContextType | undefined>(undefined);

export const AnnotationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const { addTransaction } = useSales();
  const { getCustomerById } = useCustomers();
  const { toast } = useToast();

  useEffect(() => {
    const annotationsCollection = collection(db, 'annotations');
    const q = query(annotationsCollection);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const annotationsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const ann = new ConcreteAnnotation(doc.id, data.name, data.customerId);
            ann.items = (data.items || []).map((item: any) => new ConcreteOrderItem(item.menuItem, item.quantity));
            ann.status = data.status;
            ann.createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            ann.closedAt = data.closedAt?.toDate ? data.closedAt.toDate() : undefined;
            return ann;
        });
        setAnnotations(annotationsData);
    });

    return () => unsubscribe();
  }, []);


  const addAnnotation = useCallback(async (name: string, customerId?: string): Promise<Annotation | undefined> => {
    const customerName = customerId ? getCustomerById(customerId)?.name || name : name;
    
    const newAnnotationData = {
        name: customerName,
        customerId: customerId || null,
        items: [],
        status: 'open',
        createdAt: serverTimestamp(),
        closedAt: null,
    };

    try {
        const annotationsCollection = collection(db, 'annotations');
        const docRef = await addDoc(annotationsCollection, newAnnotationData);
        toast({ title: "Sucesso", description: `Anotação criada.` });
        // We return a temporary object, the real data will come from Firestore stream
        return new ConcreteAnnotation(docRef.id, customerName, customerId);
    } catch(e) {
        console.error(e);
        toast({ title: "Erro", description: "Não foi possível criar anotação.", variant: "destructive" });
        return undefined;
    }
  }, [getCustomerById, toast]);

  const updateAnnotationItems = async (annotationId: string, newItems: OrderItem[]) => {
    const annotationDoc = doc(db, 'annotations', annotationId);
    const itemsPlain = newItems.map(item => ({
        menuItem: { id: item.menuItem.id, name: item.menuItem.name, price: item.menuItem.price, category: item.menuItem.category },
        quantity: item.quantity,
        totalPrice: item.totalPrice,
    }));
    await updateDoc(annotationDoc, { items: itemsPlain });
  }

  const addItemToAnnotation = useCallback(async (annotationId: string, menuItem: MenuItem, quantity: number) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation || annotation.status !== 'open') return;

    const existingItemIndex = annotation.items.findIndex(item => item.menuItem.id === menuItem.id);
    let newItems: OrderItem[];

    if (existingItemIndex > -1) {
      newItems = annotation.items.map((item, index) => 
        index === existingItemIndex 
          ? new ConcreteOrderItem(menuItem, item.quantity + quantity) 
          : item
      );
    } else {
      newItems = [...annotation.items, new ConcreteOrderItem(menuItem, quantity)];
    }
    
    try {
        await updateAnnotationItems(annotationId, newItems);
        toast({ title: "Item Adicionado", description: `${quantity}x ${menuItem.name} adicionado(s).` });
    } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Não foi possível adicionar o item.", variant: "destructive" });
    }
  }, [annotations, toast]);
  
  const removeItemFromAnnotation = useCallback(async (annotationId: string, menuItemId: string, quantityToRemove: number) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation || annotation.status !== 'open') return;
    
    const newItems = annotation.items
      .map(item => {
        if (item.menuItem.id === menuItemId) {
          const newQuantity = item.quantity - quantityToRemove;
          return newQuantity > 0 ? new ConcreteOrderItem(item.menuItem, newQuantity) : null;
        }
        return item;
      })
      .filter((item): item is OrderItem => item !== null);
      
      try {
        await updateAnnotationItems(annotationId, newItems);
        toast({ title: "Item Removido" });
      } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Não foi possível remover o item.", variant: "destructive" });
      }
  }, [annotations, toast]);

  const closeAnnotation = useCallback(async (annotationId: string, paymentMethod: string) => {
    const annotationToClose = annotations.find(a => a.id === annotationId);
    if (annotationToClose && annotationToClose.status === 'open') {
      
      try {
        await addTransaction({
            items: annotationToClose.items,
            totalAmount: annotationToClose.totalAmount,
            annotationId: annotationToClose.id,
            paymentMethod: paymentMethod,
        });

        const annotationDoc = doc(db, 'annotations', annotationId);
        await updateDoc(annotationDoc, {
            status: 'paid',
            closedAt: serverTimestamp()
        });

        toast({ title: "Anotação Fechada", description: `Pagamento registrado com sucesso.` });

      } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Falha ao fechar a anotação.", variant: "destructive" });
      }
    }
  }, [annotations, addTransaction, toast]);
  
  const getAnnotationById = useCallback((annotationId: string) => {
    return annotations.find(annotation => annotation.id === annotationId);
  }, [annotations]);

  const value = useMemo(() => ({
    annotations, addAnnotation, addItemToAnnotation, removeItemFromAnnotation, closeAnnotation, getAnnotationById 
  }), [annotations, addAnnotation, addItemToAnnotation, removeItemFromAnnotation, closeAnnotation, getAnnotationById]);

  return (
    <AnnotationsContext.Provider value={value}>
      {children}
    </AnnotationsContext.Provider>
  );
};

export const useAnnotations = (): AnnotationsContextType => {
  const context = useContext(AnnotationsContext);
  if (!context) {
    throw new Error('useAnnotations must be used within an AnnotationsProvider');
  }
  return context;
};
