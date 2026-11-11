"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { EventoForm, HospedagemData } from "../components/eventoForm";

export default function NovaHospedagemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCriar = async (formData: HospedagemData) => {
    setIsSubmitting(true);
    try {
      const consumosLimpos = (formData.consumos || []).map((c) => ({
        id: Number(c.id || Date.now()),
        descricao: String(c.descricao || ""),
        valor: String(c.valor || "0"),
      }));

      const parseNumber = (val: string | number | undefined) => {
        if (!val) return 0;
        const parsed = parseFloat(val.toString().replace(/[^0-9,.-]+/g, "").replace(",", "."));
        return isNaN(parsed) ? 0 : parsed;
      };

      const hospedagemData = {
        // Hóspede
        nomeHospede: String(formData.nomeHospede || ""),
        telefone: String(formData.telefone || ""),
        documento: String(formData.documento || ""),

        // Quarto & Datas
        quarto: String(formData.quarto || ""),
        dataCheckIn: String(formData.dataCheckIn || ""),
        dataCheckOut: String(formData.dataCheckOut || ""),

        // Valores e Status
        valorDiaria: String(formData.valorDiaria || "0"),
        valorDiariaNum: parseNumber(formData.valorDiaria),
        adiantamento: String(formData.adiantamento || "0"),
        adiantamentoNum: parseNumber(formData.adiantamento),
        statusConta: String(formData.statusConta || "Aberta"),

        // Consumos e Observações
        consumos: consumosLimpos,
        observacoes: String(formData.observacoes || ""),

        // Totais calculados
        diasEstadia: Number(formData.diasEstadia || 1),
        totalDiarias: Number(formData.totalDiarias || 0),
        totalConsumo: Number(formData.totalConsumo || 0),
        totalGeral: Number(formData.totalGeral || 0),
        saldoPagar: Number(formData.saldoPagar || 0),

        createdAt: serverTimestamp(),
      };

      console.log("Enviando hospedagem para o Firebase...", hospedagemData);

      const docRef = await addDoc(collection(db, "hospedagens"), hospedagemData);

      console.log("Sucesso! ID:", docRef.id);
      alert("Hospedagem cadastrada com sucesso!");
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

  return <EventoForm onSubmit={handleCriar} isSubmitting={isSubmitting} />;
}