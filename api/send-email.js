const nodemailer = require('nodemailer');
const { connectDB, Invoice } = require('./_db');

function buildCalendarLink(invoice) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const title = encodeURIComponent(`Emitir Nota Fiscal — ${invoice.company}`);
  const details = encodeURIComponent(
    `Nota fiscal da empresa ${invoice.company}${invoice.cnpj ? ' (CNPJ: ' + invoice.cnpj + ')' : ''} no valor de R$ ${Number(invoice.amount).toFixed(2)}.${invoice.notes ? '\n\nObservações: ' + invoice.notes : ''}`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${today}/${today}&details=${details}`;
}

function buildHtml(invoice) {
  const calLink = buildCalendarLink(invoice);
  const amount = Number(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const createdAt = new Date(invoice.createdAt).toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 36px;">
      <p style="margin:0 0 4px;color:#93c5fd;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;">Sistema de Notas Fiscais</p>
      <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:700;">Lembrete de Emissão</h1>
    </div>
    <div style="padding:32px 36px;">
      <p style="margin:0 0 24px;color:#334155;font-size:.95rem;line-height:1.6;">
        Você tem uma nota fiscal pendente de emissão. Confira os detalhes abaixo:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr style="background:#f8fafc;">
          <td style="padding:10px 14px;color:#64748b;font-size:.85rem;border-radius:6px 0 0 0;">Empresa</td>
          <td style="padding:10px 14px;color:#0f172a;font-weight:600;border-radius:0 6px 0 0;">${invoice.company}</td>
        </tr>
        ${invoice.cnpj ? `<tr><td style="padding:10px 14px;color:#64748b;font-size:.85rem;background:#fff;">CNPJ</td><td style="padding:10px 14px;color:#0f172a;font-weight:600;background:#fff;">${invoice.cnpj}</td></tr>` : ''}
        <tr style="background:#f8fafc;">
          <td style="padding:10px 14px;color:#64748b;font-size:.85rem;">Valor</td>
          <td style="padding:10px 14px;color:#1d4ed8;font-weight:700;font-size:1.05rem;">${amount}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#64748b;font-size:.85rem;background:#fff;">Cadastrada em</td>
          <td style="padding:10px 14px;color:#0f172a;font-weight:600;background:#fff;">${createdAt}</td>
        </tr>
        ${invoice.notes ? `<tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-size:.85rem;">Observações</td><td style="padding:10px 14px;color:#0f172a;">${invoice.notes}</td></tr>` : ''}
      </table>
      <a href="${calLink}" target="_blank"
         style="display:block;text-align:center;background:#2563eb;color:#fff;text-decoration:none;
                padding:15px 24px;border-radius:10px;font-weight:700;font-size:.95rem;letter-spacing:.02em;">
        📅 Adicionar ao Google Calendar
      </a>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:.78rem;text-align:center;">
        Lembrete automático gerado pelo seu sistema de notas fiscais.
      </p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  await connectDB();

  const { invoiceId } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId obrigatório.' });

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Nota não encontrada.' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: `"Notas Fiscais" <${process.env.EMAIL_USER}>`,
    to: invoice.email,
    subject: `📋 Lembrete: Emitir Nota — ${invoice.company}`,
    html: buildHtml(invoice)
  });

  return res.json({ success: true });
};
