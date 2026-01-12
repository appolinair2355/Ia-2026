
import { z } from "zod";
import { insertCategorySchema, insertKnowledgeSchema, insertUnansweredSchema, categories, knowledgeBase, unansweredQuestions } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  chat: {
    ask: {
      method: "POST" as const,
      path: "/api/chat/ask",
      input: z.object({ question: z.string() }),
      responses: {
        200: z.object({
          answer: z.string(),
          found: z.boolean()
        })
      }
    }
  },
  admin: {
    login: {
      method: "POST" as const,
      path: "/api/admin/login",
      input: z.object({ password: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized
      }
    }
  },
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories",
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>())
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/categories",
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/categories/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound
      }
    }
  },
  knowledge: {
    import: {
      method: "POST" as const,
      path: "/api/knowledge/import",
      input: z.object({
        categoryId: z.number(),
        content: z.string(),
        password: z.string().optional()
      }),
      responses: {
        200: z.object({ imported: z.number(), duplicates: z.number() }),
        404: errorSchemas.notFound
      }
    }
  },
  unanswered: {
    list: {
      method: "GET" as const,
      path: "/api/unanswered",
      responses: {
        200: z.array(z.custom<typeof unansweredQuestions.$inferSelect>())
      }
    },
    resolve: {
      method: "POST" as const,
      path: "/api/unanswered/resolve",
      input: z.object({
        id: z.number(),
        answer: z.string(),
        categoryId: z.number()
      }),
      responses: {
        200: z.custom<typeof knowledgeBase.$inferSelect>(),
        404: errorSchemas.notFound
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
