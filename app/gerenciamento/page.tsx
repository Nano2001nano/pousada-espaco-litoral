"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/**
 * Interface representativa de um consumo individual vinculado à estadia.
 */
interface Consumo {
  id: number;
  descricao: string;
  valor: string | number;
}

/**
 * Interface dos dados de hospedagem recuperados do Firestore.
 */
interface Hospedagem {
  id: string;
  nomeHospede: string;
  telefone: string;
  documento?: string;
  quarto: string;
  dataCheckIn: string;
  dataCheckOut: string;
  valorDiariaNum?: number;
  adiantamentoNum?: number;
  statusConta: "Aberta" | "Fechada";
  consumos?: Consumo[];
  totalDiarias?: number;
  totalConsumo?: number;
  totalGeral?: number;
  saldoPagar?: number;
  observacoes?: string;
}

/**
 * Painel de Gerenciamento de Quartos e Hospedagens
 * 
 * Atua como o centro de operações do balcão:
 * - Lista todas as estadias ativas/passadas ordenadas por data de criação;
 * - Permite alternar rapidamente o status da conta (Em Aberto / Fechada);
 * - Abre modal para lançamento rápido de itens consumidos no frigobar;
 * - Recalcula e persiste saldos a pagar diretamente no Cloud Firestore.
 */
export default function GerenciamentoPousada() {
  const router = useRouter();
  
  // Estado principal contendo os registros de hospedagem
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de controle do Modal de Consumo Rápido
  const [selectedHospedagem, setSelectedHospedagem] = useState<Hospedagem | null>(null);
  const [descConsumo, setDescConsumo] = useState("");
  const [valorConsumo, setValorConsumo] = useState("");
  const [savingConsumo, setSavingConsumo] = useState(false);

  /**
   * Busca todas as hospedagens cadastradas no Firestore,
   * ordenando pelas mais recentes (createdAt desc).
   */
  const fetchHospedagens = async () => {
    try {
      const q = query(collection(db, "hospedagens"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const lista = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Hospedagem[];

      setHospedagens(lista);
    } catch (error) {
      console.error("Erro ao buscar hospedagens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados na montagem do componente
  useEffect(() => {
    fetchHospedagens();
  }, []);

  /**
   * Converte strings de moeda formatada para tipo numérico float.
   */
  const parseNumber = (val: string | number | undefined) => {
    if (!val) return 0;
    const parsed = parseFloat(val.toString().replace(/[^0-9,.-]+/g, "").replace(",", "."));
    return isNaN(parsed) ? 0 : parsed;
  };

  /**
   * Formata números para moeda brasileira (R$).
   */
  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  };

  /**
   * Converte datas do formato ISO/HTML (AAAA-MM-DD) para padrão brasileiro (DD/MM/AAAA).
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  /**
   * Remove o registro da hospedagem do banco de dados e da interface local.
   */
  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta hospedagem?")) {
      try {
        await deleteDoc(doc(db, "hospedagens", id));
        setHospedagens((prev) => prev.filter((h) => h.id !== id));
      } catch (error) {
        console.error("Erro ao excluir hospedagem:", error);
        alert("Erro ao excluir o registro.");
      }
    }
  };

  /**
   * Alterna de forma atômica o status da conta entre 'Aberta' e 'Fechada'.
   */
  const handleAlternarStatus = async (item: Hospedagem) => {
    const novoStatus: "Aberta" | "Fechada" = item.statusConta === "Aberta" ? "Fechada" : "Aberta";
    try {
      await updateDoc(doc(db, "hospedagens", item.id), {
        statusConta: novoStatus,
      });
      // Atualização otimista no estado local
      setHospedagens((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, statusConta: novoStatus } : h))
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não foi possível atualizar o status da conta.");
    }
  };

  /**
   * Registra um novo item de consumo para a hospedagem selecionada,
   * recalculando instantaneamente o total de consumo, total geral e saldo devedor.
   */
  const handleAddConsumoRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospedagem || !descConsumo || !valorConsumo) return;

    setSavingConsumo(true);
    try {
      const novoItem: Consumo = {
        id: Date.now(),
        descricao: descConsumo,
        valor: valorConsumo,
      };

      // Atualização dos arrays de consumo e recálculo financeiro consolidado
      const consumosAtualizados = [...(selectedHospedagem.consumos || []), novoItem];
      const novoTotalConsumo = consumosAtualizados.reduce((acc, c) => acc + parseNumber(c.valor), 0);
      const totalDiarias = Number(selectedHospedagem.totalDiarias || 0);
      const adiantamento = Number(selectedHospedagem.adiantamentoNum || 0);
      const novoTotalGeral = totalDiarias + novoTotalConsumo;
      const novoSaldoPagar = novoTotalGeral - adiantamento;

      // Persistência das métricas atualizadas no Firestore
      await updateDoc(doc(db, "hospedagens", selectedHospedagem.id), {
        consumos: consumosAtualizados,
        totalConsumo: novoTotalConsumo,
        totalGeral: novoTotalGeral,
        saldoPagar: novoSaldoPagar,
      });

      // Reflete as novas métricas na interface do usuário
      setHospedagens((prev) =>
        prev.map((h) =>
          h.id === selectedHospedagem.id
            ? {
                ...h,
                consumos: consumosAtualizados,
                totalConsumo: novoTotalConsumo,
                totalGeral: novoTotalGeral,
                saldoPagar: novoSaldoPagar,
              }
            : h
        )
      );

      // Fecha e limpa o modal
      setSelectedHospedagem(null);
      setDescConsumo("");
      setValorConsumo("");
    } catch (error) {
      console.error("Erro ao lançar consumo:", error);
      alert("Erro ao adicionar consumo.");
    } finally {
      setSavingConsumo(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center font-sans bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#ecfdf5] min-h-screen py-8 px-4 sm:px-6 text-slate-800">
      <main className="flex w-full max-w-5xl flex-col px-6 py-8 md:p-10 bg-white/85 backdrop-blur-md rounded-3xl border border-amber-200 shadow-xl">
        
        {/* Cabeçalho de Navegação e Ações Rápidas */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-amber-200">
          <button
            onClick={() => router.push("/")}
            className="text-emerald-800 hover:text-emerald-950 transition-colors text-sm font-semibold flex items-center gap-1"
          >
            ← Início
          </button>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#0f766e]">Quartos & Hospedagens</h1>
          <button
            onClick={() => router.push("/hospedagem")}
            className="text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md"
          >
            + Novo Check-in
          </button>
        </div>

        {/* Grade de Listagem dos Quartos */}
        {loading ? (
          <div className="flex justify-center py-10 text-amber-900/60 font-medium">Carregando quartos...</div>
        ) : hospedagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 gap-2">
            <span className="text-4xl">🏖️</span>
            <p className="font-medium">Nenhuma hospedagem registrada no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hospedagens.map((hosp) => (
              <div
                key={hosp.id}
                className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-5 flex flex-col gap-4 hover:border-amber-400 hover:shadow-md transition-all"
              >
                {/* Identificação do Quarto, Hóspede e Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase font-bold text-amber-700 tracking-wider">Quarto</span>
                    <h2 className="font-extrabold text-xl text-slate-800">{hosp.quarto}</h2>
                    <span className="text-sm font-bold text-teal-800 mt-0.5">{hosp.nomeHospede}</span>
                    <span className="text-xs text-slate-500">📞 {hosp.telefone}</span>
                  </div>

                  {/* Botão de Toggle do Status da Comanda */}
                  <button
                    onClick={() => handleAlternarStatus(hosp)}
                    title="Clique para alternar status"
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                      hosp.statusConta === "Fechada"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {hosp.statusConta === "Fechada" ? "✓ Fechada" : "⏳ Em Aberto"}
                  </button>
                </div>

                {/* Período da Estadia */}
                <div className="text-xs text-slate-600 flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100 font-medium">
                  <span>📅 Entrada: {formatDate(hosp.dataCheckIn)}</span>
                  <span>•</span>
                  <span>Saída: {formatDate(hosp.dataCheckOut)}</span>
                </div>

                {/* Resumo Financeiro da Comanda */}
                <div className="bg-white/80 rounded-xl p-3.5 border border-amber-100 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Consumos Extras:</span>
                    <span className="font-medium text-slate-700">{formatCurrency(hosp.totalConsumo)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total da Estadia:</span>
                    <span className="font-medium text-slate-700">{formatCurrency(hosp.totalGeral)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-100 mt-1">
                    <span className="font-bold text-slate-700 text-sm">Saldo a Pagar:</span>
                    <span className={`font-black text-base ${Number(hosp.saldoPagar || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {formatCurrency(hosp.saldoPagar)}
                    </span>
                  </div>
                </div>

                {/* Ações: Lançamento de Consumo e Exclusão */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setSelectedHospedagem(hosp)}
                    className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    🥤 + Consumo
                  </button>
                  <button
                    onClick={() => handleDelete(hosp.id)}
                    className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para Inserção Rápida de Consumo Extra */}
      {selectedHospedagem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 w-full max-w-md text-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-teal-800 mb-1">Adicionar Consumo</h3>
            <p className="text-xs text-slate-500 mb-4">
              Lançamento para <strong>{selectedHospedagem.quarto}</strong> ({selectedHospedagem.nomeHospede})
            </p>

            <form onSubmit={handleAddConsumoRapido} className="flex flex-col gap-4">
              <input
                type="text"
                required
                placeholder="Descrição (ex: Água de coco, Refri, Petisco)"
                value={descConsumo}
                onChange={(e) => setDescConsumo(e.target.value)}
                className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />

              <input
                type="text"
                required
                placeholder="Valor em R$ (ex: 8,00)"
                value={valorConsumo}
                onChange={(e) => setValorConsumo(e.target.value)}
                className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHospedagem(null);
                    setDescConsumo("");
                    setValorConsumo("");
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingConsumo}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {savingConsumo ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}