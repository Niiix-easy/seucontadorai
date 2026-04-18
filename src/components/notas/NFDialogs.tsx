import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { History, Receipt } from "lucide-react";
import HistoricoEventos from "@/components/HistoricoEventos";

export type DetalheTarget = { id: string; tipo: "nfe" | "nfse"; numero: string; serie: string } | null;
export type CancelTarget = { id: string; tipo: "nfe" | "nfse"; numero: string } | null;
export type CceTarget = { id: string; numero: string; sequencia: number } | null;

type Props = {
  detalheTarget: DetalheTarget;
  setDetalheTarget: (v: DetalheTarget) => void;
  cancelTarget: CancelTarget;
  setCancelTarget: (v: CancelTarget) => void;
  cancelMotivo: string;
  setCancelMotivo: (v: string) => void;
  onConfirmCancel: () => void;
  cceTarget: CceTarget;
  setCceTarget: (v: CceTarget) => void;
  cceTexto: string;
  setCceTexto: (v: string) => void;
  onConfirmCce: () => void;
};

export function NFDialogs({
  detalheTarget, setDetalheTarget,
  cancelTarget, setCancelTarget, cancelMotivo, setCancelMotivo, onConfirmCancel,
  cceTarget, setCceTarget, cceTexto, setCceTexto, onConfirmCce,
}: Props) {
  return (
    <>
      <Dialog open={!!detalheTarget} onOpenChange={(o) => !o && setDetalheTarget(null)}>
        <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] sm:overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {detalheTarget?.tipo === "nfe" ? "NF-e" : "NFS-e"} {detalheTarget?.numero}/{detalheTarget?.serie}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="historico">
            <TabsList>
              <TabsTrigger value="historico"><History className="w-4 h-4" /> Histórico de eventos</TabsTrigger>
            </TabsList>
            <TabsContent value="historico" className="mt-4">
              {detalheTarget && <HistoricoEventos notaId={detalheTarget.id} tipo={detalheTarget.tipo} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar {cancelTarget?.tipo === "nfe" ? "NF-e" : "NFS-e"} {cancelTarget?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do cancelamento (mínimo 15 caracteres). Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} placeholder="Ex.: Erro de digitação no valor unitário do item 1" rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelMotivo("")}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmCancel} className="bg-destructive hover:bg-destructive/90">Confirmar cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cceTarget} onOpenChange={(o) => !o && setCceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carta de correção — NF-e {cceTarget?.numero}</AlertDialogTitle>
            <AlertDialogDescription>
              Permitida apenas para corrigir informações que não alterem valor, quantidade, partes ou data. Sequência: #{(cceTarget?.sequencia ?? 0) + 1}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={cceTexto} onChange={(e) => setCceTexto(e.target.value)} placeholder="Ex.: Onde se lê 'CFOP 5101' leia-se 'CFOP 5102'" rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCceTexto("")}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmCce}>Registrar correção</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
