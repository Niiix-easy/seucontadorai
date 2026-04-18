import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR");

export type NFeData = {
  numero: string;
  serie: string;
  chave_acesso?: string | null;
  data_emissao: string;
  natureza_operacao?: string | null;
  cnpj_emitente?: string | null;
  cnpj_destinatario?: string | null;
  razao_destinatario?: string | null;
  uf_destino?: string | null;
  valor_produtos: number;
  valor_icms: number;
  valor_ipi: number;
  valor_total: number;
  status: string;
  info_complementares?: string | null;
  itens?: Array<{
    numero_item: number;
    descricao: string;
    ncm?: string | null;
    cfop?: string | null;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
  }>;
};

export type NFSeData = {
  numero: string;
  serie: string;
  codigo_verificacao?: string | null;
  data_emissao: string;
  cnpj_prestador?: string | null;
  razao_prestador?: string | null;
  cnpj_tomador?: string | null;
  razao_tomador?: string | null;
  municipio_prestacao?: string | null;
  codigo_servico?: string | null;
  discriminacao: string;
  valor_servicos: number;
  base_calculo: number;
  iss_aliquota: number;
  iss_valor: number;
  pis_valor: number;
  cofins_valor: number;
  inss_valor: number;
  ir_valor: number;
  csll_valor: number;
  valor_liquido: number;
  status: string;
};

export function gerarPDFNFe(nfe: NFeData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DANFE - Documento Auxiliar da NF-e", 10, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`NF-e nº ${nfe.numero}  ·  Série ${nfe.serie}  ·  ${fmtDate(nfe.data_emissao)}`, 10, 17);

  doc.setTextColor(0, 0, 0);
  let y = 30;

  // Status badge
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const statusColor: [number, number, number] =
    nfe.status === "cancelada" ? [220, 38, 38] : [16, 185, 129];
  doc.setFillColor(...statusColor);
  doc.roundedRect(W - 50, 26, 40, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(nfe.status.toUpperCase(), W - 30, 30.8, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Chave
  if (nfe.chave_acesso) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Chave de Acesso:", 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(nfe.chave_acesso, 10, y + 4);
    y += 10;
  }

  // Boxes
  doc.setDrawColor(200, 200, 200);
  doc.setFontSize(8);

  doc.setFont("helvetica", "bold");
  doc.text("EMITENTE", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${nfe.cnpj_emitente || "—"}`, 10, y + 4);
  doc.text(`Natureza: ${nfe.natureza_operacao || "—"}`, 10, y + 8);

  doc.setFont("helvetica", "bold");
  doc.text("DESTINATÁRIO", W / 2 + 5, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${nfe.razao_destinatario || "—"}`, W / 2 + 5, y + 4);
  doc.text(`CNPJ: ${nfe.cnpj_destinatario || "—"}  ·  UF: ${nfe.uf_destino || "—"}`, W / 2 + 5, y + 8);
  y += 14;

  // Itens
  const itens = nfe.itens || [];
  if (itens.length) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Descrição", "NCM", "CFOP", "Qtd", "Un", "V. Unit", "V. Total"]],
      body: itens.map((it) => [
        String(it.numero_item),
        it.descricao,
        it.ncm || "—",
        it.cfop || "—",
        String(it.quantidade),
        it.unidade,
        fmtBRL(it.valor_unitario),
        fmtBRL(it.quantidade * it.valor_unitario),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Totais
  autoTable(doc, {
    startY: y,
    head: [["Valor Produtos", "ICMS", "IPI", "Valor Total da NF"]],
    body: [[fmtBRL(nfe.valor_produtos), fmtBRL(nfe.valor_icms), fmtBRL(nfe.valor_ipi), fmtBRL(nfe.valor_total)]],
    styles: { fontSize: 9, halign: "right" },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  if (nfe.info_complementares) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Informações Complementares:", 10, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(nfe.info_complementares, W - 20);
    doc.text(lines, 10, y + 4);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Documento gerado por Seu Contador IA · ${new Date().toLocaleString("pt-BR")}`,
    W / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  doc.save(`NFe-${nfe.numero}-${nfe.serie}.pdf`);
}

export function gerarPDFNFSe(nfse: NFSeData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NFS-e - Nota Fiscal de Serviços Eletrônica", 10, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${nfse.numero}  ·  Série ${nfse.serie}  ·  ${fmtDate(nfse.data_emissao)}`, 10, 17);

  doc.setTextColor(0, 0, 0);
  let y = 30;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const statusColor: [number, number, number] =
    nfse.status === "cancelada" ? [220, 38, 38] : [16, 185, 129];
  doc.setFillColor(...statusColor);
  doc.roundedRect(W - 50, 26, 40, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(nfse.status.toUpperCase(), W - 30, 30.8, { align: "center" });
  doc.setTextColor(0, 0, 0);

  if (nfse.codigo_verificacao) {
    doc.setFontSize(8);
    doc.text(`Código de Verificação: ${nfse.codigo_verificacao}`, 10, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PRESTADOR", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${nfse.razao_prestador || "—"}`, 10, y + 4);
  doc.text(`CNPJ: ${nfse.cnpj_prestador || "—"}`, 10, y + 8);

  doc.setFont("helvetica", "bold");
  doc.text("TOMADOR", W / 2 + 5, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${nfse.razao_tomador || "—"}`, W / 2 + 5, y + 4);
  doc.text(`CNPJ/CPF: ${nfse.cnpj_tomador || "—"}`, W / 2 + 5, y + 8);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.text("DISCRIMINAÇÃO DOS SERVIÇOS", 10, y);
  doc.setFont("helvetica", "normal");
  const disc = doc.splitTextToSize(nfse.discriminacao, W - 20);
  doc.text(disc, 10, y + 5);
  y += 5 + disc.length * 4 + 3;

  doc.text(`Município: ${nfse.municipio_prestacao || "—"}  ·  Cód. Serviço: ${nfse.codigo_servico || "—"}`, 10, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Valor Serviços", "Deduções", "Base Cálc.", "ISS %", "ISS"]],
    body: [[
      fmtBRL(nfse.valor_servicos),
      fmtBRL(0),
      fmtBRL(nfse.base_calculo),
      `${nfse.iss_aliquota}%`,
      fmtBRL(nfse.iss_valor),
    ]],
    styles: { fontSize: 8, halign: "right" },
    headStyles: { fillColor: [20, 184, 166] },
    margin: { left: 10, right: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    head: [["PIS", "COFINS", "INSS", "IR", "CSLL", "Valor Líquido"]],
    body: [[
      fmtBRL(nfse.pis_valor),
      fmtBRL(nfse.cofins_valor),
      fmtBRL(nfse.inss_valor),
      fmtBRL(nfse.ir_valor),
      fmtBRL(nfse.csll_valor),
      fmtBRL(nfse.valor_liquido),
    ]],
    styles: { fontSize: 8, halign: "right" },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 10, right: 10 },
  });

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Documento gerado por Seu Contador IA · ${new Date().toLocaleString("pt-BR")}`,
    W / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  doc.save(`NFSe-${nfse.numero}-${nfse.serie}.pdf`);
}
