const { connectDB, Invoice } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  // Extrai o ID da query string (?id=...)
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID não informado.' });

  if (req.method === 'PATCH') {
    const fields = req.body;
    // Se está marcando como emitida, registra a data
    if (fields.issued === true) fields.issuedAt = new Date();
    if (fields.issued === false) fields.issuedAt = null;
    // Se está marcando como pago, registra a data
    if (fields.paid === true && !fields.paidAt) fields.paidAt = new Date();
    if (fields.paid === false) fields.paidAt = null;

    const updated = await Invoice.findByIdAndUpdate(id, fields, { new: true });
    if (!updated) return res.status(404).json({ error: 'Nota não encontrada.' });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await Invoice.findByIdAndDelete(id);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Método não permitido.' });
};