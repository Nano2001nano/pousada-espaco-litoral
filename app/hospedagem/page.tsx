"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { EventoForm, HospedagemData } from "../components/eventoForm";

/**
 * Página controladora para cadastro de novo Check-in / Hospedagem.
 * 
 * Responsável por receber os dados do formulário (`EventoForm`),
 * normalizar e validar os tipos primitivos (tratando moeda e strings nulas),
 * persistir o documento na coleção 'hospedagens' do Firestore e
 * redirecionar o usuário para o painel de gerenciamento.
 */
export default function NovaHospedagemPage() {
  const router = useRouter();
  
  // Estado para controlar o feedback de carregamento e prevenir múltiplos cliques/submissões
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Processa e persiste a hospedagem no Firestore.
   * @param formData Dados brutos preenchidos no formulário
   */
  const handleCriar = async (formData: HospedagemData) => {
    setIsSubmitting(true);
    try {
      // Normalização da lista de consumos iniciais (frigobar/serviços)
      const consumosLimpos = (formData.consumos || []).map((c) => ({
        id: Number(c.id || Date.now()),
        descricao: String(c.descricao || ""),
        valor: String(c.valor || "0"),
      }));

      /**
       * Função utilitária para converter strings monetárias (ex: "R$ 150,00")
       * em float nativo para cálculos e indexação numérica.
       */
      const parseNumber = (val: string | number | undefined) => {
        if (!val) return 0;
        const parsed = parseFloat(
          val.toString().replace(/[^0-9,.-]+/g, "").replace(",", ".")
        );
        return isNaN(parsed) ? 0 : parsed;
      };

      // Montagem do payload estruturado para persistência no NoSQL
      const hospedagemData = {
        // Dados Pessoais do Hóspede
        nomeHospede: String(formData.nomeHospede || ""),
        telefone: String(formData.telefone || ""),
        documento: String(formData.documento || ""),

        // Quarto & Período de Estadia
        quarto: String(formData.quarto || ""),
        dataCheckIn: String(formData.dataCheckIn || ""),
        dataCheckOut: String(formData.dataCheckOut || ""),

        // Valores Financeiros e Controle de Conta
        valorDiaria: String(formData.valorDiaria || "0"),
        valorDiariaNum: parseNumber(formData.valorDiaria),
        adiantamento: String(formData.adiantamento || "0"),
        adiantamentoNum: parseNumber(formData.adiantamento),
        statusConta: String(formData.statusConta || "Aberta"),

        // Consumos Adicionais e Notas Internas
        consumos: consumosLimpos,
        observacoes: String(formData.observacoes || ""),

        // Métricas e Totais Consolidados
        diasEstadia: Number(formData.diasEstadia || 1),
        totalDiarias: Number(formData.totalDiarias || 0),
        totalConsumo: Number(formData.totalConsumo || 0),
        totalGeral: Number(formData.totalGeral || 0),
        saldoPagar: Number(formData.saldoPagar || 0),

        // Timestamp oficial gerado pelo servidor Firebase
        createdAt: serverTimestamp(),
      };

      console.log("Enviando hospedagem para o Firebase...", hospedagemData);

      // Inserção do documento na coleção 'hospedagens'
      const docRef = await addDoc(collection(db, "hospedagens"), hospedagemData);

      console.log("Sucesso! ID:", docRef.id);
      alert("Hospedagem cadastrada com sucesso!");
      
      // Redireciona para o mapa de quartos após a conclusão
      router.push("/gerenciamento");
    } catch (error: any) {
      console.error("ERRO REAL DO FIREBASE:", error);
      alert(
        `Erro retornado pelo Firebase:\n\nCódigo: ${error?.code || "sem-codigo"}\nMensagem: ${error?.message || String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderiza o componente de formulário reutilizável
  return <EventoForm onSubmit={handleCriar} isSubmitting={isSubmitting} />;
}