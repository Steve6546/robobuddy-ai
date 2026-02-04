/**
 * @fileoverview نقطة الدخول الرئيسية للتطبيق - Main Application Entry Point
 * 
 * @description
 * يجمع جميع Providers والتوجيهات الرئيسية.
 * 
 * @future_flags
 * تم إضافة future flags لـ React Router v7 لتجنب التحذيرات:
 * - v7_startTransition: يلف تحديثات الحالة في React.startTransition
 * - v7_relativeSplatPath: تغيير سلوك المسارات النسبية في Splat routes
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
