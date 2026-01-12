
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  question: text("question").notNull().unique(),
  answer: text("answer").notNull(),
  alternativeAnswers: text("alternative_answers"), // Format: answer1||answer2
  intention: text("intention"),
  ton: text("ton"),
  confidence: integer("confidence").default(100),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
});

export const unansweredQuestions = pgTable("unanswered_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  askedAt: timestamp("asked_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertKnowledgeSchema = createInsertSchema(knowledgeBase).omit({ id: true });
export const insertUnansweredSchema = createInsertSchema(unansweredQuestions).omit({ id: true, askedAt: true });

export type Category = typeof categories.$inferSelect;
export type Knowledge = typeof knowledgeBase.$inferSelect;
export type UnansweredQuestion = typeof unansweredQuestions.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertKnowledge = z.infer<typeof insertKnowledgeSchema>;
export type InsertUnanswered = z.infer<typeof insertUnansweredSchema>;
