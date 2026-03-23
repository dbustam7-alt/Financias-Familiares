/**
 * DATABASE SCHEMA (Conceptual / Prisma-like)
 * 
 * Goals:
 * 1. Track fixed/variable/hormiga categories.
 * 2. Support granular "Hormiga" tagging for analysis.
 * 3. Match Excel's credit card tracking (Visa/Falabella).
 */

const CategoryType = {
  FIXED: 'fijo',
  VARIABLE: 'variable',
  HORMIGA: 'hormiga',
  INCOME: 'ingreso'
};

const PaymentMethod = {
  CASH: 'efectivo',
  DEBIT: 'debito',
  TC_VISA: 'tc_visa',
  TC_FALABELLA: 'tc_falabella'
};

const Models = {
  Transaction: {
    id: 'uuid',
    date: 'ISO8601',
    description: 'string', // e.g., "Tinto", "Arriendo"
    amount: 'decimal',
    categoryId: 'category_uuid',
    paymentMethod: 'string',
    isHormiga: 'boolean',
    userId: 'user_uuid'
  },
  Category: {
    id: 'uuid',
    name: 'string',
    type: 'string',
    icon: 'string'
  },
  Budget: {
    id: 'uuid',
    categoryId: 'category_uuid',
    monthlyLimit: 'decimal',
    period: 'YYYY-MM'
  }
};

export default Models;
