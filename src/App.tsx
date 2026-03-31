import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Contabil from "./pages/Contabil";
import Fiscal from "./pages/Fiscal";
import Folha from "./pages/Folha";
import ImportacaoXML from "./pages/ImportacaoXML";
import Automacao from "./pages/Automacao";
import CRM from "./pages/CRM";
import Tarefas from "./pages/Tarefas";
import Documentos from "./pages/Documentos";
import Financeiro from "./pages/Financeiro";
import BI from "./pages/BI";
import IAContabil from "./pages/IAContabil";
import IAChat from "./pages/IAChat";
import Portal from "./pages/Portal";
import Assinatura from "./pages/Assinatura";
import Sefaz from "./pages/Sefaz";
import Bancos from "./pages/Bancos";
import Certificados from "./pages/Certificados";
import CalculadoraICMSST from "./pages/CalculadoraICMSST";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/contabil" element={<Contabil />} />
              <Route path="/fiscal" element={<Fiscal />} />
              <Route path="/folha" element={<Folha />} />
              <Route path="/xml" element={<ImportacaoXML />} />
              <Route path="/automacao" element={<Automacao />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/bi" element={<BI />} />
              <Route path="/ia" element={<IAContabil />} />
              <Route path="/ia-chat" element={<IAChat />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/sefaz" element={<Sefaz />} />
              <Route path="/bancos" element={<Bancos />} />
              <Route path="/certificados" element={<Certificados />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
