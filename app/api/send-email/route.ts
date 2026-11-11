import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, evento } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail não informado." }, { status: 400 });
    }

    const formatCurrency = (val: string | number) => {
      if (!val) return "R$ 0,00";
      const num = typeof val === "number" ? val : parseFloat(val.toString().replace(/[^0-9,.-]+/g, "").replace(",", "."));
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isNaN(num) ? 0 : num);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    };

    // Detalhamento de RH / Equipe
    const rhHtml = `
      <li style="margin-bottom: 6px;">
        <strong>Promotores:</strong> ${evento.promotores || 0} ${evento.valorPromotor ? `(Unitário: ${formatCurrency(evento.valorPromotor)})` : ""}
      </li>
      ${
        evento.coordenadores
          ? `<li style="margin-bottom: 6px;"><strong>Coordenadores:</strong> ${evento.coordenadores} ${evento.valorCoordenador ? `(Unitário: ${formatCurrency(evento.valorCoordenador)})` : ""}</li>`
          : ""
      }
      ${
        evento.apoios
          ? `<li style="margin-bottom: 6px;"><strong>Apoios:</strong> ${evento.apoios} ${evento.valorApoio ? `(Unitário: ${formatCurrency(evento.valorApoio)})` : ""}</li>`
          : ""
      }
    `;

    // Detalhamento de Gastos Extras
    const custosHtml =
      evento.custos && evento.custos.length > 0
        ? evento.custos
            .map(
              (c: { descricao: string; valor: string | number }) => `
            <li style="margin-bottom: 6px;">
              <strong>${c.descricao || "Item Sem Nome"}:</strong> ${formatCurrency(c.valor)}
            </li>
          `
            )
            .join("")
        : "<li>Nenhum gasto extra registrado.</li>";

    // Layout do e-mail
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #fcefe0; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        
        <h1 style="color: #fcefe0; font-size: 22px; margin-bottom: 20px; border-bottom: 1px solid #023270; padding-bottom: 12px;">
          📊 Relatório de Evento: ${evento.nome}
        </h1>

        <div style="margin-bottom: 24px;">
          <p style="margin: 6px 0;"><strong>📅 Data:</strong> ${formatDate(evento.data)}</p>
          <p style="margin: 6px 0;"><strong>💰 Total Cobrado pelo Serviço:</strong> ${formatCurrency(evento.valorServico || evento.valorServicoNum)}</p>
          <p style="margin: 6px 0;"><strong>📜 Status NF:</strong> ${evento.statusNf || "Pendente"}</p>
        </div>

        <h3 style="color: #fcefe0; font-size: 16px; border-bottom: 1px solid #023270; padding-bottom: 6px; margin-top: 24px;">
          👥 Recursos Humanos
        </h3>
        <ul style="padding-left: 20px; color: #fcefe0; margin-top: 12px;">
          ${rhHtml}
        </ul>

        <h3 style="color: #fcefe0; font-size: 16px; border-bottom: 1px solid #023270; padding-bottom: 6px; margin-top: 24px;">
          🧾 Gastos Extras / Custos da Operação
        </h3>
        <ul style="padding-left: 20px; color: #fcefe0; margin-top: 12px;">
          ${custosHtml}
        </ul>

        ${
          evento.observacoes
            ? `
          <h3 style="color: #fcefe0; font-size: 16px; border-bottom: 1px solid #023270; padding-bottom: 6px; margin-top: 24px;">
            📝 Observações
          </h3>
          <p style="margin-top: 8px; font-size: 14px; opacity: 0.9; white-space: pre-wrap;">${evento.observacoes}</p>
        `
            : ""
        }

        <div style="background-color: #023270; padding: 18px; border-radius: 12px; margin-top: 28px; border: 1px solid rgba(252, 239, 224, 0.2);">
          <p style="margin: 4px 0; font-size: 14px; opacity: 0.9;">
            <strong>Total Gastos Extras:</strong> ${formatCurrency(evento.totalCustos)}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 18px; color: ${(evento.lucroEstimado || 0) >= 0 ? "#22c55e" : "#ef4444"};">
            <strong>Lucro Estimado:</strong> ${formatCurrency(evento.lucroEstimado)}
          </p>
        </div>

      </div>
    `;

    // Envio via Resend
    const data = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [email],
      subject: `Relatório do Evento: ${evento.nome}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro no Resend:", error);
    return NextResponse.json({ error: "Falha ao enviar e-mail." }, { status: 500 });
  }
}