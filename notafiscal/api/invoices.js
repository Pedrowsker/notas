const { connectDB, Invoice } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  if (req.method === 'GET') {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return res.json(invoices);
  }

  if (req.method === 'POST') {
    const { company, cnpj, amount, email, notes } = req.body;
    if (!company || !amount || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios: empresa, valor e e-mail.' });
    }
    const invoice = new Invoice({ company, cnpj, amount, email, notes });
    await invoice.save();
    return res.status(201).json(invoice);
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
