import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['bank', 'cash', 'pay', 'stock', 'other'] }).notNull(),
  description: text('description'),
  createdAt: text('createdAt').notNull(),
});

export const weeklyRecords = sqliteTable('weekly_records', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  recordDate: text('recordDate').notNull(),
  balance: real('balance').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const weeklyNotes = sqliteTable('weekly_notes', {
  id: text('id').primaryKey(),
  recordDate: text('recordDate').notNull(),
  incomeNote: text('incomeNote'),
  expenseNote: text('expenseNote'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 定义表关系
export const accountsRelations = relations(accounts, ({ many }) => ({
  weeklyRecords: many(weeklyRecords),
}));

export const weeklyRecordsRelations = relations(weeklyRecords, ({ one }) => ({
  account: one(accounts, {
    fields: [weeklyRecords.accountId],
    references: [accounts.id],
  }),
}));

// 导出完整的 schema
export const schema = {
  accounts,
  weeklyRecords,
  weeklyNotes,
  accountsRelations,
  weeklyRecordsRelations,
};