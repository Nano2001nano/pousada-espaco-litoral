"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { EventoForm } from "../../components/eventoForm";

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id as string;

  const [eventoData, setEventoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const docRef = doc(db, "eventos", eventoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Trata os dados do Firebase para o formato que o formulário espera
          setEventoData({
            nome: data.nome || "",
            data: data.data || "",
            promotores: data.promotores !== undefined ? String(data.promotores) : "",
            funcao: data.funcao || "",
            // Prioriza o valor numérico salvo ou o campo de texto original
            valorServico: data.valorServicoNum !== undefined ? String(data.valorServicoNum) : (data.valorServico || ""),
            statusNf: data.statusNf || "Pendente",
            email: data.email || "",
            custos: data.custos && data.custos.length > 0 ? data.custos : [{ id: Date.now(), descricao: "", valor: "" }]
          });
        } else {
          alert("Evento não encontrado!");
          router.push("/visualizar-eventos");
        }
      } catch (error) {
        console.error("Erro ao buscar evento:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventoId) {
      fetchEvento();
    }
  }, [eventoId, router]);

  const handleAtualizar = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const eventoAtualizado = {
        ...formData,
        promotores: Number(formData.promotores),
        valorServicoNum: parseFloat(formData.valorServico.toString().replace(/[^0-9,.-]+/g, "").replace(",", ".")),
        updatedAt: new Date(),
      };

      const docRef = doc(db, "eventos", eventoId);
      await updateDoc(docRef, eventoAtualizado);
      
      router.push("/visualizar-eventos");
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      alert("Erro ao atualizar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c10] text-white">
        Carregando informações do evento...
      </div>
    );
  }

  return <EventoForm initialData={eventoData} onSubmit={handleAtualizar} isSubmitting={isSubmitting} />;
}