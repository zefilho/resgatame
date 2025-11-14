
"use client";

import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sandwich } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar className="border-r border-sidebar-border" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Sandwich className="h-8 w-8 text-sidebar-foreground flex-shrink-0" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground leading-tight">
                Controle de Vendas
              </h1>
              <p className="text-sm text-sidebar-foreground/80">Resgata-me</p>
            </div>
          </Link>
        </SidebarHeader>
        <Separator className="bg-sidebar-border" />
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <Separator className="bg-sidebar-border" />
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>SB</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground">Lanchonete/Lojinha</span>
              <span className="text-xs text-sidebar-foreground/70">Online</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md md:justify-end">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <Button variant="ghost" size="sm">Ajuda</Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t p-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Controle de Vendas. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
