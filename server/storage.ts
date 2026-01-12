
import { db } from "./db";
import {
  categories,
  knowledgeBase,
  unansweredQuestions,
  type Category,
  type Knowledge,
  type UnansweredQuestion,
  type InsertCategory,
  type InsertKnowledge,
  type InsertUnanswered,
} from "@shared/schema";
import { eq, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Knowledge Base
  findAnswer(question: string): Promise<Knowledge | undefined>;
  addKnowledge(knowledge: InsertKnowledge): Promise<Knowledge>;
  checkKnowledgeExists(question: string, categoryId: number): Promise<boolean>;

  // Unanswered
  getUnansweredQuestions(): Promise<UnansweredQuestion[]>;
  addUnansweredQuestion(question: InsertUnanswered): Promise<UnansweredQuestion>;
  deleteUnansweredQuestion(id: number): Promise<void>;
  getUnansweredQuestion(id: number): Promise<UnansweredQuestion | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(knowledgeBase).where(eq(knowledgeBase.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Knowledge Base
  async findAnswer(question: string, context?: { lastQuestion?: string; lastAnswer?: string }): Promise<{ knowledge: Knowledge; confidence: number } | undefined> {
    const normalized = this.normalize(question);
    
    // Identity check
    if (normalized.includes("comment tu t'appelles") || 
        normalized.includes("qui es tu") || 
        normalized.includes("ton nom") || 
        normalized.includes("qui t'a cree")) {
      return {
        confidence: 100,
        knowledge: {
          id: 0,
          question: question,
          answer: "Je suis l'IA Kousossou, créée par Sossou Kouamé Appolinaire, développeur web.",
          alternativeAnswers: null,
          intention: "identite",
          ton: "neutre",
          confidence: 100,
          categoryId: 0
        }
      };
    }

    // Small talk / Positive feedback check
    const positiveTokens = ["ok", "d'accord", "cool", "c'est bien", "super", "genial", "magnifique"];
    if (positiveTokens.includes(normalized)) {
      const responses = [
        "C'est super ! Je suis ravi que ça te plaise.",
        "D'accord, je suis là si tu as besoin d'autre chose.",
        "Génial ! Continuons notre discussion si tu veux.",
        "Merci ! C'est un plaisir d'échanger avec toi."
      ];
      return {
        confidence: 100,
        knowledge: {
          id: -1,
          question: question,
          answer: responses[Math.floor(Math.random() * responses.length)],
          alternativeAnswers: null,
          intention: "small_talk",
          ton: "joyeux",
          confidence: 100,
          categoryId: 0
        }
      };
    }

    const allKnowledge = await db.select().from(knowledgeBase);
    
    // Exact match on normalized
    let match = allKnowledge.find(k => this.normalize(k.question) === normalized);
    let confidence = 100;
    
    if (!match) {
      // Fuzzy match (containment)
      match = allKnowledge.find(k => normalized.includes(this.normalize(k.question)) || this.normalize(k.question).includes(normalized));
      confidence = 85;
    }

    // Contextual refinement (Couche 4 & Contextuelle)
    if (!match && context?.lastQuestion) {
      // Simple context check: if the user says something very short like "c'est le travail", 
      // check if it relates to the previous answer/intention
      const combined = this.normalize(context.lastQuestion + " " + question);
      match = allKnowledge.find(k => this.normalize(k.question).includes(normalized) && combined.includes(this.normalize(k.question)));
      if (match) confidence = 75;
    }

    if (match) {
      // Handle variants (Couche 3)
      let finalAnswer = match.answer;
      if (match.alternativeAnswers) {
        const variants = [match.answer, ...match.alternativeAnswers.split("||")];
        finalAnswer = variants[Math.floor(Math.random() * variants.length)];
      }

      // Enriched structure (Couche 3 & Tone adaptation Couche 4)
      const ton = match.ton || "neutre";
      const intro = this.getIntroByTone(ton);
      const outro = this.getOutroByTone(ton);
      
      return {
        confidence: match.confidence || confidence,
        knowledge: { ...match, answer: `${intro}${finalAnswer}\n\n${outro}` }
      };
    }
    
    return undefined;
  }

  private getIntroByTone(ton: string): string {
    switch (ton) {
      case "joyeux": return "C'est un plaisir de te lire ! ";
      case "triste": return "Je suis vraiment désolé de l'apprendre... ";
      case "affectif": return "Oh, c'est touchant. ";
      case "serieux": return "C'est une question importante. ";
      default: return "";
    }
  }

  private getOutroByTone(ton: string): string {
    switch (ton) {
      case "joyeux": return "Dis-moi, qu'est-ce qui te rend aussi enthousiaste aujourd'hui ?";
      case "triste": return "N'hésite pas à m'en dire plus si tu as besoin de parler, je suis là pour toi.";
      case "affectif": return "C'est précieux ce que tu partages. Comment te sens-tu par rapport à ça ?";
      case "serieux": return "J'espère que cela t'éclaire. Souhaites-tu approfondir un point particulier ?";
      default: return "Comment puis-je t'aider davantage ?";
    }
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[?!.,;:]/g, "")      // Remove punctuation
      .replace(/\s+/g, " ")          // Normalize spaces
      // Advanced normalization (Couche 1)
      .replace(/\b(cc|slt|bjr)\b/g, "bonjour")
      .replace(/\bcava\b/g, "comment vas tu")
      .trim();
  }

  async addKnowledge(knowledge: InsertKnowledge): Promise<Knowledge> {
    const [newKnowledge] = await db.insert(knowledgeBase).values(knowledge).returning();
    return newKnowledge;
  }

  async checkKnowledgeExists(question: string, categoryId: number): Promise<boolean> {
    const [existing] = await db
        .select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.question, question)); // Check globally or per category? Globally makes sense to avoid dupes.
    return !!existing;
  }

  // Unanswered
  async getUnansweredQuestions(): Promise<UnansweredQuestion[]> {
    return await db.select().from(unansweredQuestions).orderBy(desc(unansweredQuestions.askedAt));
  }

  async addUnansweredQuestion(question: InsertUnanswered): Promise<UnansweredQuestion> {
    // Check if already in unanswered to avoid spam
    const [existing] = await db
        .select()
        .from(unansweredQuestions)
        .where(ilike(unansweredQuestions.question, question.question));
    
    if (existing) return existing;

    const [newUnanswered] = await db.insert(unansweredQuestions).values(question).returning();
    return newUnanswered;
  }

  async deleteUnansweredQuestion(id: number): Promise<void> {
    await db.delete(unansweredQuestions).where(eq(unansweredQuestions.id, id));
  }

  async getUnansweredQuestion(id: number): Promise<UnansweredQuestion | undefined> {
      const [q] = await db.select().from(unansweredQuestions).where(eq(unansweredQuestions.id, id));
      return q;
  }
}

export const storage = new DatabaseStorage();
