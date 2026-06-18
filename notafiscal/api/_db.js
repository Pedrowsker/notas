const mongoose = require('mongoose');

let cached = global._mongooseCache;
if (!cached) { cached = global._mongooseCache = { conn: null, promise: null }; }

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const InvoiceSchema = new mongoose.Schema({
  company:   { type: String, required: true },
  cnpj:      { type: String, default: '' },
  amount:    { type: Number, required: true },
  email:     { type: String, required: true },
  issued:    { type: Boolean, default: false },
  issuedAt:  { type: Date, default: null },
  notes:     { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

module.exports = { connectDB, Invoice };
