
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingCart,
  History,
  Users,
  Contact,
  Package,
  FileText, // New Icon for Reports
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  separator?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/annotations', label: 'Anotações de Pedidos', icon: Users },
  { href: '/dashboard/orders', label: 'Novo Pedido', icon: ShoppingCart },
  { href: '/dashboard/sales', label: 'Registro de Vendas', icon: History },
  { href: '/dashboard/payments', label: 'Taxas & Pagamentos', icon: CreditCard },
  { href: '/dashboard/customers', label: 'Clientes', icon: Contact },
  { href: '/dashboard/items', label: 'Itens', icon: Package },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileText, separator: true },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 px-4 py-6">
      {navItems.map((item) => (
        <React.Fragment key={item.href}>
          {item.separator && <Separator className="my-2 bg-sidebar-border" />}
          <Button
            asChild
            variant={pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start text-sm',
               (pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        </React.Fragment>
      ))}

      {/* Logos no rodapé da navbar, abaixo do item Relatórios */}
      <div className="mt-6 pt-4 border-t border-sidebar-border flex flex-col items-center justify-center gap-3 px-2">
        <img
          src="/assets/logo-o-caminho.png"
          alt="Logo O Caminho"
          className="h-20 w-auto max-w-[85%] object-contain rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-105"
        />
        <img
          src="/assets/logo-juventude-caminho.jpg"
          alt="Logo Juventude do Caminho"
          className="h-20 w-auto max-w-[85%] object-contain rounded-lg bg-white p-1 shadow-md transition-transform hover:scale-105"
        />
      </div>
    </nav>
  );
}
