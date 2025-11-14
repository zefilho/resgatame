
"use client";

import { MenuProvider } from '@/contexts/MenuContext';
import { SalesProvider } from '@/contexts/SalesContext';
import { AnnotationsProvider } from '@/contexts/AnnotationsContext';
import { CustomersProvider } from '@/contexts/CustomersContext';
import React from 'react';
import FirebaseClientProvider from '@/firebase/client-provider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FirebaseClientProvider>
        <MenuProvider>
          <CustomersProvider>
            <SalesProvider>
              <AnnotationsProvider>
                {children}
              </AnnotationsProvider>
            </SalesProvider>
          </CustomersProvider>
        </MenuProvider>
    </FirebaseClientProvider>
  );
};
