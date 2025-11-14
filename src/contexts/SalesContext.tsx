
"use client";

import type { Transaction, OrderItem } from '@/types';
import { ConcreteOrderItem } from '@/types';
import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase/client';

export type Period = 'today' | 'last20days';

interface SalesStats {
  revenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface ItemSaleSummary {
  name: string;
  quantity: number;
}

interface PaymentMethodSummary {
  method: string;
  total: number;
}

interface DailyFinancialSummary {
  [date: string]: {
    total: number;
    methods: {
      [method: string]: number;
    };
  };
}

interface SalesContextType {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  getStatsForPeriod: (period: Period) => SalesStats;
  getTransactionsForPeriod: (period: Period) => Transaction[];
  getItemSalesSummaryForPeriod: (period: Period) => ItemSaleSummary[];
  getPaymentMethodSummaryForPeriod: (period: Period) => PaymentMethodSummary[];
  getDailyFinancialSummary: () => DailyFinancialSummary;
  getFullItemSalesSummary: () => ItemSaleSummary[];
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          items: (data.items || []).map((item: any) => new ConcreteOrderItem(item.menuItem, item.quantity)),
        } as Transaction;
      });
      setTransactions(salesData);
    });

    return () => unsubscribe();
  }, []);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    const salesCollection = collection(db, 'sales');
    const itemsPlain = data.items.map(item => ({
        menuItem: { id: item.menuItem.id, name: item.menuItem.name, price: item.menuItem.price, category: item.menuItem.category },
        quantity: item.quantity,
        totalPrice: item.totalPrice,
    }));

    const newTransaction = {
      ...data,
      items: itemsPlain,
      timestamp: serverTimestamp(),
    };
    try {
      await addDoc(salesCollection, newTransaction);
    } catch(e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível registrar a venda.', variant: 'destructive' });
      throw e;
    }
  }, [toast]);
  
  const getTransactionsForPeriod = useCallback((period: Period): Transaction[] => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setHours(0, 0, 0, 0);

    if (period === 'last20days') {
      startDate.setDate(startDate.getDate() - 19);
    }

    return transactions.filter(txn => new Date(txn.timestamp) >= startDate);
  }, [transactions]);
  
  const getStatsForPeriod = useCallback((period: Period): SalesStats => {
    const relevantTransactions = getTransactionsForPeriod(period);
    const revenue = relevantTransactions.reduce((sum, txn) => sum + txn.totalAmount, 0);
    const totalOrders = relevantTransactions.length;
    const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
    return { revenue, totalOrders, averageOrderValue };
  }, [getTransactionsForPeriod]);
  
  const getItemSalesSummaryForPeriod = useCallback((period: Period): ItemSaleSummary[] => {
    const relevantTransactions = getTransactionsForPeriod(period);
    const summary: { [key: string]: number } = {};

    relevantTransactions.forEach(txn => {
      txn.items.forEach(item => {
        summary[item.menuItem.name] = (summary[item.menuItem.name] || 0) + item.quantity;
      });
    });

    return Object.entries(summary)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [getTransactionsForPeriod]);

  const getFullItemSalesSummary = useCallback((): ItemSaleSummary[] => {
    const summary: { [key: string]: number } = {};
    transactions.forEach(txn => {
      txn.items.forEach(item => {
        summary[item.menuItem.name] = (summary[item.menuItem.name] || 0) + item.quantity;
      });
    });

    return Object.entries(summary)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [transactions]);

  const getPaymentMethodSummaryForPeriod = useCallback((period: Period): PaymentMethodSummary[] => {
    const relevantTransactions = getTransactionsForPeriod(period);
    const summary: { [key: string]: number } = {};
    relevantTransactions.forEach(txn => {
      const method = txn.paymentMethod || 'Não definido';
      summary[method] = (summary[method] || 0) + txn.totalAmount;
    });

    return Object.entries(summary)
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }, [getTransactionsForPeriod]);

  const getDailyFinancialSummary = useCallback((): DailyFinancialSummary => {
    const summary: DailyFinancialSummary = {};
    transactions.forEach(txn => {
      const date = new Date(txn.timestamp).toLocaleDateString('pt-BR');
      const method = txn.paymentMethod || 'Não definido';
      const amount = txn.totalAmount;

      if (!summary[date]) {
        summary[date] = { total: 0, methods: {} };
      }
      summary[date].total += amount;

      if (!summary[date].methods[method]) {
        summary[date].methods[method] = 0;
      }
      summary[date].methods[method] += amount;
    });

    return summary;
  }, [transactions]);

  const value = useMemo(() => ({
    transactions, 
    addTransaction, 
    getStatsForPeriod, 
    getTransactionsForPeriod, 
    getItemSalesSummaryForPeriod, 
    getPaymentMethodSummaryForPeriod, 
    getDailyFinancialSummary, 
    getFullItemSalesSummary
  }), [
    transactions, addTransaction, getStatsForPeriod, getTransactionsForPeriod, 
    getItemSalesSummaryForPeriod, getPaymentMethodSummaryForPeriod, getDailyFinancialSummary, getFullItemSalesSummary
  ]);

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
