"use client";

import type { CustomerTab, OrderItem, MenuItem } from '@/types';
import { ConcreteCustomerTab, ConcreteOrderItem } from '@/types';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSales } from './SalesContext'; // Assuming SalesContext exists for recording transactions

interface TabsContextType {
  tabs: CustomerTab[];
  addTab: (name: string) => CustomerTab;
  addItemToTab: (tabId: string, menuItem: MenuItem, quantity: number) => void;
  closeTab: (tabId: string, paymentMethod: string) => void;
  getTabById: (tabId: string) => CustomerTab | undefined;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<CustomerTab[]>([]);
  const { addTransaction } = useSales();

  const addTab = useCallback((name: string): CustomerTab => {
    const newTab = new ConcreteCustomerTab(`tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, name);
    setTabs(prevTabs => [...prevTabs, newTab]);
    return newTab;
  }, []);

  const addItemToTab = useCallback((tabId: string, menuItem: MenuItem, quantity: number) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === tabId && tab.status === 'open') {
          const existingItemIndex = tab.items.findIndex(item => item.menuItem.id === menuItem.id);
          let newItems: OrderItem[];
          if (existingItemIndex > -1) {
            newItems = tab.items.map((item, index) => 
              index === existingItemIndex 
                ? new ConcreteOrderItem(menuItem, item.quantity + quantity) 
                : item
            );
          } else {
            newItems = [...tab.items, new ConcreteOrderItem(menuItem, quantity)];
          }
          // Create a new tab instance to ensure reactivity if ConcreteCustomerTab methods depend on immutability
          const updatedTab = new ConcreteCustomerTab(tab.id, tab.name);
          updatedTab.items = newItems;
          updatedTab.status = tab.status;
          updatedTab.createdAt = tab.createdAt;
          return updatedTab;
        }
        return tab;
      })
    );
  }, []);

  const closeTab = useCallback((tabId: string, paymentMethod: string) => {
    const tabToClose = tabs.find(t => t.id === tabId);
    if (tabToClose && tabToClose.status === 'open') {
      addTransaction({
        items: tabToClose.items,
        totalAmount: tabToClose.totalAmount,
        tabId: tabToClose.id,
        paymentMethod: paymentMethod,
      });
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === tabId ? { ...tab, status: 'paid' } : tab
        )
      );
    }
  }, [tabs, addTransaction]);
  
  const getTabById = useCallback((tabId: string) => {
    return tabs.find(tab => tab.id === tabId);
  }, [tabs]);

  return (
    <TabsContext.Provider value={{ tabs, addTab, addItemToTab, closeTab, getTabById }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = (): TabsContextType => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
};
