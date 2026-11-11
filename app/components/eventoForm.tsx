"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface Consumo {
  id: number;
  descricao: string;
  valor: string | number;
}

export interface HospedagemData {
  nomeHospede: string;
  telefone: string;
  documento: string;
  quarto: string;
  dataCheckIn: string;
  dataCheckOut: string;
  valorDiaria: string | number;
  adiantamento: string | number;
  statusConta: "Aberta" | "Fechada";
  consumos: Consumo[];
  observacoes?: string;
  diasEstadia?: number;
  totalDiarias?: number;
  totalConsumo?: number;
  totalGeral?: number;
  saldoPagar?: number;
}

interface HospedagemFormProps {
  initialData?: HospedagemData;
  onSubmit: (formData: HospedagemData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EventoForm({ initialData, onSubmit, isSubmitting = false }: HospedagemFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<HospedagemData>({
    nomeHospede: "",
    telefone: "",
    documento: "",
    quarto: "",
    dataCheckIn: "",
    dataCheckOut: "",
    valorDiaria: "",
    adiantamento: "",
    statusConta: "Aberta",
    consumos: [{ id: Date.now(), descricao: "", valor: "" }],
    observacoes: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeHospede: initialData.nomeHospede || "",
        telefone: initialData.telefone || "",
        documento: initialData.documento || "",
        quarto: initialData.quarto || "",
        dataCheckIn: initialData.dataCheckIn || "",
        dataCheckOut: initialData.dataCheckOut || "",
        valorDiaria: initialData.valorDiaria || "",
        adiantamento: initialData.adiantamento || "",
        statusConta: initialData.statusConta || "Aberta",
        consumos: initialData.consumos && initialData.consumos.length > 0
          ? initialData.consumos
          : [{ id: Date.now(), descricao: "", valor: "" }],
        observacoes: initialData.observacoes || ""
      });
    }
  }, [initialData]);

  const parseCurrency = (value: string | number) => {
    if (!value) return 0;
    const parsed = parseFloat(value.toString().replace(/[^0-9,.-]+/g, "").replace(",", "."));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStatusConta = (status: "Aberta" | "Fechada") => {
    setFormData({ ...formData, statusConta: status });
  };

  const handleConsumoChange = (id: number, field: keyof Consumo, value: string) => {
    setFormData(prev => ({
      ...prev,
      consumos: prev.consumos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addConsumo = () => {
    setFormData(prev => ({
      ...prev,
      consumos: [...prev.consumos, { id: Date.now(), descricao: "", valor: "" }]
    }));
  };

  const removeConsumo = (id: number) => {
    setFormData(prev => ({
      ...prev,
      consumos: prev.consumos.filter(c => c.id !== id)
    }));
  };

  const calcularDias = () => {
    if (!formData.dataCheckIn || !formData.dataCheckOut) return 1;
    const inicio = new Date(formData.dataCheckIn);
    const fim = new Date(formData.dataCheckOut);
    const diffMs = fim.getTime() - inicio.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDias > 0 ? diffDias : 1;
  };

  const diasEstadia = calcularDias();
  const diariaNum = parseCurrency(formData.valorDiaria);
  const totalDiarias = diasEstadia * diariaNum;
  const totalConsumo = formData.consumos.reduce((acc, c) => acc + parseCurrency(c.valor), 0);
  const totalGeral = totalDiarias + totalConsumo;
  const adiantamentoNum = parseCurrency(formData.adiantamento);
  const saldoPagar = totalGeral - adiantamentoNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      diasEstadia,
      totalDiarias,
      totalConsumo,
      totalGeral,
      saldoPagar
    });
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#ecfdf5] min-h-screen py-8 px-4 sm:px-6 text-slate-800">
      <main className="flex w-full max-w-3xl flex-col px-6 py-8 md:p-10 bg-white/90 backdrop-blur-md rounded-3xl border border-amber-200 shadow-xl">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-200">
          <button
            onClick={() => router.back()}
            type="button"
            className="text-emerald-800 hover:text-emerald-950 transition-colors text-sm font-semibold flex items-center gap-1"
          >
            ← Voltar
          </button>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#0f766e]">
            {initialData?.nomeHospede ? "Editar Hospedagem" : "Novo Check-in"}
          </h1>
          <div className="w-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* Dados do Hóspede */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[#0f766e] text-sm md:text-base font-bold flex items-center gap-2 border-b border-amber-100 pb-2">
              👤 Dados do Hóspede
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Nome Completo *</label>
                <input
                  type="text"
                  name="nomeHospede"
                  value={formData.nomeHospede}
                  onChange={handleChange}
                  placeholder="Ex: João da Silva"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(71) 99999-9999"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Documento (CPF / RG)</label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                />
              </div>
            </div>
          </section>

          {/* Quarto & Datas */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[#0f766e] text-sm md:text-base font-bold flex items-center gap-2 border-b border-amber-100 pb-2">
              🛏️ Quarto & Período de Estadia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Identificação do Quarto *</label>
                <input
                  type="text"
                  name="quarto"
                  value={formData.quarto}
                  onChange={handleChange}
                  placeholder="Ex: Quarto Amarelo"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Data de Entrada *</label>
                <input
                  type="date"
                  name="dataCheckIn"
                  value={formData.dataCheckIn}
                  onChange={handleChange}
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Previsão Saída *</label>
                <input
                  type="date"
                  name="dataCheckOut"
                  value={formData.dataCheckOut}
                  onChange={handleChange}
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>
            </div>
          </section>

          {/* Consumos do Frigobar */}
          <section className="flex flex-col gap-4 bg-amber-50/60 p-5 rounded-2xl border border-amber-200">
            <div className="flex justify-between items-center">
              <h2 className="text-[#0f766e] text-sm md:text-base font-bold flex items-center gap-2">
                🥤 Frigobar & Consumo Extra
              </h2>
              <span className="text-xs font-bold text-amber-800">Total: {formatCurrency(totalConsumo)}</span>
            </div>

            <div className="flex flex-col gap-3">
              {formData.consumos.map((consumo, index) => (
                <div key={consumo.id || index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={consumo.descricao}
                    onChange={(e) => handleConsumoChange(consumo.id, "descricao", e.target.value)}
                    placeholder={`Item ${index + 1} (ex: Água de coco, Refri)`}
                    className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 w-full focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={consumo.valor}
                    onChange={(e) => handleConsumoChange(consumo.id, "valor", e.target.value)}
                    placeholder="R$ 0,00"
                    className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 w-28 md:w-36 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeConsumo(consumo.id)}
                    className="text-rose-500 hover:text-rose-700 px-2 text-xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addConsumo}
                className="mt-1 w-full py-2.5 rounded-xl text-xs font-bold border border-dashed border-amber-300 text-amber-800 bg-white/60 hover:bg-white transition-all"
              >
                + Adicionar item consumido
              </button>
            </div>
          </section>

          {/* Diárias & Pagamentos */}
          <section className="flex flex-col gap-4">
            <h2 className="text-[#0f766e] text-sm md:text-base font-bold flex items-center gap-2 border-b border-amber-100 pb-2">
              💳 Valores & Pagamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Valor da Diária (R$) *</label>
                <input
                  type="text"
                  name="valorDiaria"
                  value={formData.valorDiaria}
                  onChange={handleChange}
                  placeholder="150,00"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Sinal / Adiantamento (R$)</label>
                <input
                  type="text"
                  name="adiantamento"
                  value={formData.adiantamento}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Status da Conta</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusConta("Aberta")}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.statusConta === "Aberta"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-slate-600 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    ⏳ Em Aberto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusConta("Fechada")}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.statusConta === "Fechada"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-600 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    ✓ Fechada
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Observações */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[#0f766e] text-sm md:text-base font-bold flex items-center gap-2 border-b border-amber-100 pb-2">
              📝 Observações da Estadia
            </h2>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              placeholder="Ex: Cama extra solicitada, restrições alimentares, horário previsto de chegada..."
              className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors w-full resize-none"
            />
          </section>

          {/* Resumo da Conta */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 mb-1">
                Total Previsto ({diasEstadia} {diasEstadia === 1 ? "diária" : "diárias"} + extras)
              </span>
              <span className="text-xl font-bold text-slate-800">{formatCurrency(totalGeral)}</span>
            </div>
            
            <div className="flex flex-col md:items-end">
              <span className="text-xs font-semibold text-slate-500 mb-1">Saldo a Pagar</span>
              <span className={`text-2xl font-black ${saldoPagar > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatCurrency(saldoPagar)}
              </span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${
                isSubmitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
              }`}
            >
              {isSubmitting ? "Gravando dados..." : "Salvar Hospedagem"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}