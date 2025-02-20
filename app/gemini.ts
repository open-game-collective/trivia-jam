import { z } from "zod";
import type { Env } from "./env";
import type { Question } from "./game.types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  correctAnswer: z.union([z.number(), z.string()]),
  questionType: z.enum(["numeric", "multiple-choice"]),
  options: z.array(z.string()).optional(),
});

const QuestionsResponseSchema = z.array(QuestionSchema);

export type ParsedQuestion = z.infer<typeof QuestionSchema>;

const GEMINI_PROMPT = `You are a precise question parser that extracts trivia questions and their correct answers from documents.
Your task is to parse questions and their answers exactly as they appear, without making assumptions or modifications.
For multiple choice questions:
1. The correct answer is ALWAYS indicated by "Correct answer: X" where X is the letter
2. You must map that letter to the FULL TEXT of the corresponding option
3. You must include ALL options in the options array
4. The options must be extracted exactly as written, preserving their order
5. The question text should NOT include the options - extract only the question itself
6. For example, given:
   "What major canal opened in 1914? a) Suez Canal b) Panama Canal c) Erie Canal d) English Channel"
   The question text should be: "What major canal opened in 1914?"
   And options array should be: ["Suez Canal", "Panama Canal", "Erie Canal", "English Channel"]

For numeric questions:
1. The answer should be converted to a number
2. No units should be included in the answer`;

function preprocessDocument(doc: string): string {
  // Standardize line endings and remove extra whitespace
  return doc
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function validateMultipleChoiceAnswer(question: any): void {
  if (question.questionType === "multiple-choice") {
    // Ensure options array exists
    if (!Array.isArray(question.options) || question.options.length === 0) {
      throw new Error(`Question ${question.id}: Multiple choice question must have options array`);
    }

    // Ensure the correct answer exactly matches one of the options
    if (!question.options.includes(question.correctAnswer)) {
      throw new Error(
        `Question ${question.id}: Correct answer "${question.correctAnswer}" must exactly match one of the options: ${question.options.join(", ")}`
      );
    }
  }
}

function extractOptionsFromText(text: string): string[] {
  // Extract options that appear after the question mark
  const questionParts = text.split('?');
  if (questionParts.length < 2) return [];
  
  const optionsText = questionParts[1].trim();
  const optionsMatch = optionsText.match(/[a-d]\)(.*?)(?=[a-d]\)|$)/gi);
  if (!optionsMatch) return [];
  return optionsMatch.map(opt => opt.replace(/^[a-d]\)\s*/, '').trim());
}

function extractQuestionText(text: string): string {
  // For multiple choice, only take the text up to the question mark
  const questionParts = text.split('?');
  if (questionParts.length > 1) {
    return questionParts[0].trim() + '?';
  }
  return text.trim();
}

export async function parseQuestions(
  documentContent: string,
  env: Env
): Promise<Record<string, Question>> {
  try {
    const preprocessedContent = preprocessDocument(documentContent);
    console.log("Starting question parsing with preprocessed input:", preprocessedContent);
    
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    // Define the response schema for Gemini
    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for the question - MUST be in format 'q' followed by the sequential number (e.g., q1, q2, q3)",
          },
          text: {
            type: SchemaType.STRING,
            description: "The question text",
          },
          correctAnswer: {
            type: SchemaType.STRING,
            description: "For multiple choice: the FULL TEXT of the correct option (not just the letter). For numeric: the number as a string.",
          },
          questionType: {
            type: SchemaType.STRING,
            description: "Type of question (numeric or multiple-choice)",
            enum: ["numeric", "multiple-choice"],
          },
          options: {
            type: SchemaType.ARRAY,
            description: "For multiple choice: array of ALL option texts in order. Required for multiple choice questions.",
            items: {
              type: SchemaType.STRING,
            }
          },
        },
        required: ["id", "text", "correctAnswer", "questionType"],
      },
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent([
      {
        text: GEMINI_PROMPT,
      },
      {
        text: `Rules for parsing:
1. For numeric questions:
   - Extract ONLY the number, no units
   - Convert text numbers to digits (e.g., "three" → "3")
   - Verify the answer is a valid number

2. For multiple choice questions:
   - Look for "Correct answer: X" where X is a letter (A/B/C/D)
   - Map that letter to the FULL TEXT of the corresponding option
   - Extract ALL options in order
   - The correct answer must EXACTLY match one of the options
   - Do not modify or rephrase any option text

3. Question IDs:
   - Start with 'q' followed by sequential numbers (q1, q2, q3, etc.)
   - Must match the exact order in the document

4. General rules:
   - Preserve exact text and formatting
   - Do not make assumptions about answers
   - Do not modify or "fix" anything
   - If unsure about parsing, throw an error`,
      },
      {
        text: "Input document to parse:\n" + preprocessedContent,
      }
    ]);

    console.log("Full Gemini response:", result);
    const response = result.response;
    console.log("Response object:", response);

    const text = response.text();
    console.log("Raw API response:", text);

    // Parse and validate the response
    const parsedQuestions = JSON.parse(text);
    console.log("Parsed JSON:", parsedQuestions);

    // Validate sequential IDs and multiple choice answers
    parsedQuestions.forEach((q: any, index: number) => {
      const expectedId = `q${index + 1}`;
      if (q.id !== expectedId) {
        throw new Error(`Question IDs must be sequential. Expected ${expectedId} but got ${q.id}`);
      }
      
      // Additional validation for multiple choice questions
      validateMultipleChoiceAnswer(q);
      
      // For multiple choice questions, verify options match the question text
      if (q.questionType === "multiple-choice") {
        const extractedOptions = extractOptionsFromText(q.text);
        if (extractedOptions.length > 0 && !extractedOptions.every((opt, i) => opt === q.options[i])) {
          throw new Error(
            `Question ${q.id}: Extracted options don't match the options in the question text`
          );
        }
      }
    });

    const processedQuestions = parsedQuestions.map((q: { questionType: string; correctAnswer: string }) => ({
      ...q,
      correctAnswer: q.questionType === "numeric" ? Number(q.correctAnswer) : q.correctAnswer
    }));
    console.log("Processed questions with numeric conversion:", processedQuestions);

    const validatedQuestions = QuestionsResponseSchema.parse(processedQuestions);
    console.log("Validated questions:", validatedQuestions);

    // Convert array to record with IDs as keys while preserving order
    const finalResult = validatedQuestions.reduce((acc, question) => {
      acc[question.id] = {
        ...question,
        // Store the original position to maintain order
        originalIndex: parseInt(question.id.substring(1)) - 1
      };
      return acc;
    }, {} as Record<string, Question & { originalIndex: number }>);
    
    console.log("Final result:", finalResult);
    return finalResult;
  } catch (error) {
    console.error("Error parsing questions:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
}
