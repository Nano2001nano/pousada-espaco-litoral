"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Página Inicial / Dashboard de Entrada
 * 
 * Atua como o menu central da aplicação com navegação simplificada (mobile-first),
 * direcionando a recepcionista para o fluxo de cadastro de hóspedes (Check-in)
 * ou para o painel de monitoramento de quartos e comandas (Gerenciamento).
 */
export default function Home() {
  // Hook de navegação do App Router do Next.js para transições client-side rápidas
  const router = useRouter();

  return (
    <div 
      className="relative flex flex-col min-h-screen items-center justify-center font-sans bg-cover bg-center bg-no-repeat text-slate-800 px-4 sm:px-6"
      style={{ backgroundImage: "url('/bg-pousada.jpg')" }}
    >
      {/* 
        Overlay com escurecimento sutil e blur no fundo:
        Garante contraste com o card central e valoriza o visual litorâneo
      */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

      {/* Card principal com efeito glassmorphism (vidro fosco) */}
      <main className="relative z-10 flex w-full max-w-xl flex-col items-center py-10 px-6 sm:px-10 bg-white/90 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl transition-all">

        {/* Identidade Visual / Cabeçalho da Pousada */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* 
            Container com posicionamento relativo obrigatório para o uso de Image fill.
            O atributo priority garante o carregamento prioritário (LCP) da logo.
          */}
          <div className="w-64 h-36 relative mb-3 drop-shadow-md">
            <Image
              src="/logo-pousada.png"
              alt="Pousada Espaço Litoral"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f766e] tracking-tight">
            Controle da Pousada Espaço Litoral
          </h1>
          <p className="text-xs sm:text-sm text-amber-800/80 font-medium mt-1">
            Gestão de hóspedes, consumo nos quartos e fechamento de conta
          </p>
        </div>

        {/* Menu de Ações Rápidas da Recepção */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Botão de Check-in: Encaminha para o formulário de entrada */}
          <button
            type="button"
            onClick={() => router.push("/hospedagem")}
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-left"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">🛎️</span>
              <div>
                <h3 className="font-bold text-base">Novo Check-in</h3>
                <p className="text-xs text-amber-100">Cadastrar hóspede, quarto e diárias</p>
              </div>
            </div>
            <span className="text-white/80 group-hover:translate-x-1 font-bold text-lg transition-transform">→</span>
          </button>

          {/* Botão de Gerenciamento: Encaminha para o mapa de ocupação e comandas */}
          <button
            type="button"
            onClick={() => router.push("/gerenciamento")}
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-left"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">🏨</span>
              <div>
                <h3 className="font-bold text-base">Quartos & Fechamento</h3>
                <p className="text-xs text-teal-100">Ver ocupação, frigobar e fechar conta</p>
              </div>
            </div>
            <span className="text-white/80 group-hover:translate-x-1 font-bold text-lg transition-transform">→</span>
          </button>
        </div>

        {/* Rodapé Dinâmico */}
        <div className="mt-8 text-center text-xs font-semibold text-emerald-800/70">
          Pousada Espaço Litoral © {new Date().getFullYear()}
        </div>

      </main>
    </div>
  );
}