
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { unansweredQuestions } from "@shared/schema";
import { ilike } from "drizzle-orm";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Use the agent-provided search tool
async function doWebSearch(query: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant de recherche. Ta tâche est de répondre de manière TRÈS courte (maximum 2 phrases) et précise à la question posée. Ne fais pas de phrases d'introduction comme 'C'est une excellente question'. Si tu ne sais pas, réponds simplement 'null'."
        },
        {
          role: "user",
          content: query
        }
      ],
      max_completion_tokens: 150
    });

    const answer = completion.choices[0].message.content;
    if (answer && answer.toLowerCase() !== "null") {
      return answer;
    }
  } catch (err) {
    console.error("OpenAI search failed:", err);
  }
  return null; 
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Chat
  app.post(api.chat.ask.path, async (req, res) => {
    try {
      const parsed = api.chat.ask.input.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      const { question } = parsed.data;

      const result = await storage.findAnswer(question);

      if (result) {
        const { knowledge, confidence } = result;
        let finalAnswer = knowledge.answer;
        
        if (confidence < 80) {
          finalAnswer = `Je ne suis pas totalement sûr, mais voici ce que je peux te dire…\n\n${finalAnswer}`;
        }
        
        res.json({ answer: finalAnswer, found: true, confidence });
      } else {
        // Attempt web search via the provided tool in the server environment
        try {
          const searchResponse = await doWebSearch(question);
          if (searchResponse) {
            return res.json({ 
              answer: searchResponse, 
              found: true,
              confidence: 90
            });
          }
        } catch (searchErr) {
          console.error("Web search failed:", searchErr);
        }

        await storage.addUnansweredQuestion({ question });
        res.json({ 
          answer: "Désolé, je ne connais pas encore la réponse à cette question.", 
          found: false 
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Auth Middleware (Removed auth)
  const requireAuth = (req: any, res: any, next: any) => {
    next();
  };

  app.post(api.admin.login.path, async (req, res) => {
    const { password } = api.admin.login.input.parse(req.body);
    if (password === "kouame") {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Mot de passe incorrect" });
    }
  });

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, requireAuth, async (req, res) => {
    try {
      const category = api.categories.create.input.parse(req.body);
      const newCategory = await storage.createCategory(category);
      res.status(201).json(newCategory);
    } catch (err) {
      res.status(400).json({ message: "Validation error" });
    }
  });
  
  app.delete(api.categories.delete.path, requireAuth, async (req, res) => {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
  });

  // Knowledge Import
  app.post(api.knowledge.import.path, requireAuth, async (req, res) => {
    try {
      const { categoryId, content } = api.knowledge.import.input.parse(req.body);
      const lines = content.split('\n');
      let imported = 0;
      let duplicates = 0;

      for (const line of lines) {
        if (!line.trim()) continue;
        const [qPart, rest] = line.split('=');
        if (!qPart || !rest) continue;
        
        const [answer, alts, intention, ton] = rest.split('||').map(s => s.trim());
        
        if (qPart.trim() && answer) {
          const exists = await storage.checkKnowledgeExists(qPart.trim(), categoryId);
          if (!exists) {
            await storage.addKnowledge({
              question: qPart.trim(),
              answer: answer,
              alternativeAnswers: alts || null,
              intention: intention || null,
              ton: ton || null,
              categoryId
            });
            imported++;

            // Clean up unanswered questions
            await db.delete(unansweredQuestions)
                .where(ilike(unansweredQuestions.question, qPart.trim()));

          } else {
            duplicates++;
          }
        }
      }

      res.json({ imported, duplicates });
    } catch (err) {
      console.error("Import error:", err);
      res.status(400).json({ message: "Import failed" });
    }
  });

  // Unanswered
  app.get(api.unanswered.list.path, requireAuth, async (req, res) => {
    const questions = await storage.getUnansweredQuestions();
    res.json(questions);
  });

  app.post(api.unanswered.resolve.path, requireAuth, async (req, res) => {
    try {
      const { id, answer, categoryId } = api.unanswered.resolve.input.parse(req.body);
      const questionRecord = await storage.getUnansweredQuestion(id);
      
      if (!questionRecord) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Add to knowledge base
      const newKnowledge = await storage.addKnowledge({
        question: questionRecord.question,
        answer,
        categoryId
      });

      // Remove from unanswered
      await storage.deleteUnansweredQuestion(id);

      res.json(newKnowledge);
    } catch (err) {
      res.status(400).json({ message: "Resolution failed" });
    }
  });

  // Seed default data if empty
  const currentCategories = await storage.getCategories();
  if (currentCategories.length === 0) {
    await storage.createCategory({ name: "General" });
    await storage.createCategory({ name: "Identite" });
    await storage.createCategory({ name: "Salutations" });
    await storage.createCategory({ name: "Religion" });
    await storage.createCategory({ name: "Sport" });
    await storage.createCategory({ name: "Sante" });
    await storage.createCategory({ name: "Geographie" });
    
    const allCats = await storage.getCategories();
    const identite = allCats.find(c => c.name === "Identite");
    const salutations = allCats.find(c => c.name === "Salutations");
    const religion = allCats.find(c => c.name === "Religion");
    const sport = allCats.find(c => c.name === "Sport");
    const sante = allCats.find(c => c.name === "Sante");
    const geographie = allCats.find(c => c.name === "Geographie");
    const general = allCats.find(c => c.name === "General");

    const defaultKnowledge = [
      { q: "bonjour", a: "Bonjour 😊", cat: salutations },
      { q: "bonsoir", a: "Oui bonsoir 👋", cat: salutations },
      { q: "comment tu t'appelles", a: "Je suis l'IA Kousossou, développée par Sossou Kouamé Appolinaire, développeur web et créateur des bots Telegram.", cat: identite },
      { q: "qui est jesus", a: "Jésus-Christ est le Fils de Dieu selon la Bible.", cat: religion },
      { q: "combien de livres dans la bible", a: "La Bible contient 66 livres.", cat: religion },
      { q: "qui a gagné la coupe du monde 2018", a: "La France a remporté la Coupe du Monde 2018.", cat: sport },
      { q: "qu'est ce que le paludisme", a: "Le paludisme est une maladie parasitaire transmise par les moustiques.", cat: sante },
      { q: "comment prevenir le diabete", a: "Une alimentation saine et l'exercice régulier aident à prévenir le diabète.", cat: sante },
      { q: "qui est le premier président du bénin", a: "Le premier président du Bénin était Hubert Maga.", cat: geographie },
      { q: "quel est la capitale de la cote d'ivoire", a: "La capitale politique de la Côte d’Ivoire est Yamoussoukro.", cat: geographie },
    ];

    for (const item of defaultKnowledge) {
      if (item.cat) {
        await storage.addKnowledge({
          question: item.q,
          answer: item.a,
          categoryId: item.cat.id
        });
      }
    }
  }

  return httpServer;
}
