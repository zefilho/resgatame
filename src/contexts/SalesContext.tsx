
"use client";

import type { Transaction, OrderItem, TagSaleSummary, ReceivablesOverview, ReceivableItem, MonthlyReceivableSummary } from '@/types';
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
  getTagSalesSummary: () => TagSaleSummary[];
  getReceivablesOverview: () => ReceivablesOverview;
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

    return transactions.filter(txn => (txn.timestamp instanceof Date ? txn.timestamp : (txn.timestamp as any).toDate?.() || new Date(txn.timestamp as any)) >= startDate);
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

  const getTagSalesSummary = useCallback((): TagSaleSummary[] => {
    const summary: Record<string, { totalAmount: number; totalQuantity: number }> = {
      'Lanchonete': { totalAmount: 0, totalQuantity: 0 },
      'Lojinha - Juventude': { totalAmount: 0, totalQuantity: 0 },
      'Lojinha - Santos Anjos': { totalAmount: 0, totalQuantity: 0 },
      'Lojinha - Apresentação': { totalAmount: 0, totalQuantity: 0 },
    };

    transactions.forEach(txn => {
      txn.items.forEach(item => {
        let tag = item.menuItem?.category || 'Lanchonete';
        if (tag === ('Lojinha - Juventure' as any)) {
          tag = 'Lojinha - Juventude';
        }
        if (!summary[tag]) {
          summary[tag] = { totalAmount: 0, totalQuantity: 0 };
        }
        summary[tag].totalAmount += item.totalPrice;
        summary[tag].totalQuantity += item.quantity;
      });
    });

    const grandTotal = Object.values(summary).reduce((sum, item) => sum + item.totalAmount, 0);

    return Object.entries(summary).map(([tag, data]) => ({
      tag,
      totalAmount: data.totalAmount,
      totalQuantity: data.totalQuantity,
      percentage: grandTotal > 0 ? (data.totalAmount / grandTotal) * 100 : 0,
    }));
  }, [transactions]);

  const getReceivablesOverview = useCallback((): ReceivablesOverview => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nowTime = today.getTime();
    const in30DaysTime = nowTime + 30 * 24 * 60 * 60 * 1000;

    let immediateRevenue = 0;
    let upcoming30Days = 0;
    let futureBeyond30Days = 0;
    let totalFutureReceivables = 0;

    const receivablesList: ReceivableItem[] = [];

    transactions.forEach(txn => {
      const saleDate = (txn.timestamp instanceof Date
        ? txn.timestamp
        : (txn.timestamp as any)?.toDate?.() || new Date(txn.timestamp as any));
      
      const method = txn.paymentMethod || 'Dinheiro';
      const methodLower = method.toLowerCase();
      const isCard = methodLower.includes('cartão') || methodLower.includes('cartao');
      const isDebit = methodLower.includes('débito') || methodLower.includes('debito');

      if (!isCard) {
        // Dinheiro / PIX
        immediateRevenue += txn.totalAmount;
        receivablesList.push({
          id: `${txn.id}-1`,
          transactionId: txn.id,
          saleDate,
          paymentMethod: method,
          installmentLabel: 'À Vista',
          expectedDepositDate: saleDate,
          amount: txn.totalAmount,
          status: 'Recebido',
        });
        return;
      }

      if (isDebit) {
        // Débito (D+1)
        const depositDate = new Date(saleDate);
        depositDate.setDate(depositDate.getDate() + 1);
        const depTime = depositDate.getTime();

        const status: 'Recebido' | 'A Receber' = depTime <= nowTime ? 'Recebido' : 'A Receber';
        if (status === 'Recebido') {
          immediateRevenue += txn.totalAmount;
        } else if (depTime <= in30DaysTime) {
          upcoming30Days += txn.totalAmount;
          totalFutureReceivables += txn.totalAmount;
        } else {
          futureBeyond30Days += txn.totalAmount;
          totalFutureReceivables += txn.totalAmount;
        }

        receivablesList.push({
          id: `${txn.id}-1`,
          transactionId: txn.id,
          saleDate,
          paymentMethod: method,
          installmentLabel: 'Débito (1/1)',
          expectedDepositDate: depositDate,
          amount: txn.totalAmount,
          status,
        });
        return;
      }

      // Crédito / Parcelado
      const match = method.match(/(\d+)\s*x/i);
      const numInstallments = match ? parseInt(match[1], 10) : 1;
      const installmentAmount = Math.round((txn.totalAmount / numInstallments) * 100) / 100;

      for (let i = 1; i <= numInstallments; i++) {
        const depositDate = new Date(saleDate);
        depositDate.setDate(depositDate.getDate() + 30 * i);
        const depTime = depositDate.getTime();

        const status: 'Recebido' | 'A Receber' = depTime <= nowTime ? 'Recebido' : 'A Receber';

        if (status === 'Recebido') {
          immediateRevenue += installmentAmount;
        } else if (depTime <= in30DaysTime) {
          upcoming30Days += installmentAmount;
          totalFutureReceivables += installmentAmount;
        } else {
          futureBeyond30Days += installmentAmount;
          totalFutureReceivables += installmentAmount;
        }

        receivablesList.push({
          id: `${txn.id}-${i}`,
          transactionId: txn.id,
          saleDate,
          paymentMethod: method,
          installmentLabel: numInstallments > 1 ? `Parcela ${i}/${numInstallments}` : 'Crédito (1x)',
          expectedDepositDate: depositDate,
          amount: installmentAmount,
          status,
        });
      }
    });

    // Grouping by Month/Year for Monthly Schedule
    const monthlyMap: Record<string, { totalAmount: number; count: number; sortKey: string }> = {};

    receivablesList.forEach(item => {
      const monthYearStr = item.expectedDepositDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalizedMonth = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);
      const yyyymm = item.expectedDepositDate.toISOString().slice(0, 7);

      if (!monthlyMap[capitalizedMonth]) {
        monthlyMap[capitalizedMonth] = { totalAmount: 0, count: 0, sortKey: yyyymm };
      }
      monthlyMap[capitalizedMonth].totalAmount += item.amount;
      monthlyMap[capitalizedMonth].count += 1;
    });

    const monthlySchedule: MonthlyReceivableSummary[] = Object.entries(monthlyMap)
      .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
      .map(([monthYear, data]) => ({
        monthYear,
        totalAmount: data.totalAmount,
        count: data.count,
      }));

    // Sort receivables list by expected deposit date descending
    receivablesList.sort((a, b) => b.expectedDepositDate.getTime() - a.expectedDepositDate.getTime());

    return {
      immediateRevenue,
      upcoming30Days,
      futureBeyond30Days,
      totalFutureReceivables,
      monthlySchedule,
      receivablesList,
    };
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
      const date = (txn.timestamp instanceof Date ? txn.timestamp : (txn.timestamp as any).toDate?.() || new Date(txn.timestamp as any)).toLocaleDateString('pt-BR');
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
    getFullItemSalesSummary,
    getTagSalesSummary,
    getReceivablesOverview
  }), [
    transactions, addTransaction, getStatsForPeriod, getTransactionsForPeriod, 
    getItemSalesSummaryForPeriod, getPaymentMethodSummaryForPeriod, getDailyFinancialSummary, getFullItemSalesSummary,
    getTagSalesSummary, getReceivablesOverview
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
