
"use client";

import type { MenuItem } from '@/types';
import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, orderBy, query, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/firebase/client';

interface MenuContextType {
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  isLoading: boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const menuCollection = collection(db, 'menuItems');
    const q = query(menuCollection, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
      setMenuItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching menu items: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id'>) => {
    try {
      const menuCollection = collection(db, 'menuItems');
      await addDoc(menuCollection, itemData);
      toast({ title: 'Sucesso', description: 'Item adicionado com sucesso.' });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar o item.', variant: 'destructive' });
    }
  }, [toast]);

  const updateMenuItem = useCallback(async (updatedItem: MenuItem) => {
    try {
      const itemDoc = doc(db, 'menuItems', updatedItem.id);
      const { id, ...itemData } = updatedItem;
      await updateDoc(itemDoc, itemData);
      toast({ title: 'Sucesso', description: 'Item atualizado com sucesso.' });
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o item.', variant: 'destructive' });
    }
  }, [toast]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    try {
      const itemDoc = doc(db, 'menuItems', itemId);
      await deleteDoc(itemDoc);
      toast({ title: 'Sucesso', description: 'Item deletado com sucesso.' });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ title: 'Erro', description: 'Não foi possível deletar o item.', variant: 'destructive' });
    }
  }, [toast]);

  const value = useMemo(() => ({
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    isLoading,
  }), [menuItems, addMenuItem, updateMenuItem, deleteMenuItem, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">Carregando dados do cardápio...</p>
            <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
