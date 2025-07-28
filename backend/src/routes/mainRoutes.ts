import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../auth';
import { prisma } from '../db';
import { LlamaParseReader } from 'llamaindex';
import 'dotenv/config';
// AI & Vector DB Imports
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Initialize Clients ---
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME as string);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

import { createClient } from '@supabase/supabase-js';
// ...existing code...

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// --- Background Processing Function for PDFs ---
// This function runs in the background so the user gets an immediate response
const processAndVectorizePdf = async (
  filePath: string,
  documentId: string,
  userId: string
) => {
  try {
    // 1. Parse with LlamaParse
    const parser = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY as string,
      resultType: 'markdown',
    });

    const documents = await parser.loadData(filePath);

    for (let index = 0; index < documents.length; index++) {
      const markdownContent = documents[index].text;

      // 2. Chunk the markdown
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
      });

      const chunks = await textSplitter.splitText(markdownContent);

      // 3. Create embeddings
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'embedding-001',
      });
      const chunkEmbeddings = await embeddings.embedDocuments(chunks);

      // 4. Prepare vectors for Pinecone
      const vectors = chunks.map((chunk, i) => ({
        id: `${documentId}-chunk-${i}`,
        values: chunkEmbeddings[i],
        metadata: {
          documentId: documentId,
          userId: userId,
          text: chunk,
        },
      }));

      // 5. Upsert to Pinecone
      await pineconeIndex.upsert(vectors);
    }
    // 6. Update document status to READY
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'READY' },
    });

    console.log(`Document ${documentId} processed successfully.`);
  } catch (error) {
    console.error(`Failed to process document ${documentId}:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    });
  }
};

// --- All routes below are protected by JWT authentication ---
router.use(authenticateJWT);

// GET a list of all documents for the logged-in user
router.get('/documents', async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(documents);
});

// GET all chat messages for a specific document
router.get('/documents/:docId/messages', async (req, res) => {
  const { docId } = req.params;
  const document = await prisma.document.findUnique({ where: { id: docId } });

  if (!document || document.userId !== req.user!.id) {
    return res
      .status(404)
      .json({ error: 'Document not found or access denied' });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { documentId: docId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(messages);
});

// POST to upload a new PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // 1. Create Document record in DB with 'PROCESSING' status
  const document = await prisma.document.create({
    data: {
      fileName: req.file.originalname,
      userId: req.user!.id,
      status: 'PROCESSING',
    },
  });

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET as string)
    .upload(req.user!.id + '/' + req.file.originalname, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (error) {
    return res.status(500).json({ error: error });
  }

  // 2. Start background processing and wait for it to finish
  await processAndVectorizePdf(
    `${process.env.SUPABASE_STORAGE_ENDPOINT}${
      process.env.SUPABASE_STORAGE_BUCKET
    }/${req.user!.id}/${req.file.originalname}`,
    document.id,
    req.user!.id
  );

  // 3. Respond to the client after processing is complete
  const updatedDocument = await prisma.document.findUnique({
    where: { id: document.id },
  });

  res.status(200).json(updatedDocument);
});

// POST a chat message to a document (RAG Pipeline)
router.post('/documents/:docId/chat', async (req, res) => {
  const { docId } = req.params;
  const { query } = req.body;
  console.log(query);

  const userId = req.user!.id;

  console.log(docId, query, userId);

  const document = await prisma.document.findUnique({ where: { id: docId } });
  if (!document || document.userId !== userId) {
    return res
      .status(404)
      .json({ error: 'Document not found or access denied' });
  }
  if (document.status !== 'READY') {
    return res
      .status(400)
      .json({ error: 'Document is not yet ready for chat.' });
  }

  // Save user's message to the database
  await prisma.chatMessage.create({
    data: { role: 'user', content: query, documentId: docId },
  });

  try {
    // 1. Create embedding for the query
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'embedding-001',
    });
    const queryEmbedding = await embeddings.embedQuery(query);

    // 2. Query Pinecone with metadata filtering
    const queryResult = await pineconeIndex.query({
      topK: 10,
      vector: queryEmbedding,
      filter: { documentId: { $eq: docId } },
      includeMetadata: true,
    });

    console.log(queryResult.matches.map((match) => match.metadata!.text));

    const context = queryResult.matches
      .map((match) => match.metadata!.text)
      .join('\n\n');

    // 3. Prepare prompt and call Gemini for streaming response
    const prompt = `You are a helpful assistant. Answer the user's question based ONLY on the provided context from the PDF document.
You MUST cite the page number for each piece of information you use. Use the format [Page X] for citations. Do not cite wrong page numbers.
If the context does not contain the answer, state that you cannot find the information in the document. Do not make up answers.

Context:
---
${context}
---

Question: ${query}
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContentStream(prompt);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let accumulatedResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      accumulatedResponse += chunkText;
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 4. Save the full AI response to the database after the stream ends
    await prisma.chatMessage.create({
      data: { role: 'ai', content: accumulatedResponse, documentId: docId },
    });

    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// make a route to delete a document + its file in supabase storage + all messages related to it
router.delete('/documents/:docId', async (req, res) => {
  const { docId } = req.params;
  const document = await prisma.document.findUnique({ where: { id: docId } });

  if (!document || document.userId !== req.user!.id) {
    return res
      .status(404)
      .json({ error: 'Document not found or access denied' });
  }

  // Delete all messages related to this document
  await prisma.chatMessage.deleteMany({ where: { documentId: docId } });

  // Delete vectors from Pinecone
  try {
    await pineconeIndex.deleteMany({
      documentId: { $eq: docId },
    });
  } catch (pineconeError) {
    console.error('Failed to delete vectors from Pinecone:', pineconeError);
    // Optionally, you can return an error here or continue
  }

  // Delete the document record
  await prisma.document.delete({ where: { id: docId } });

  // Delete the file from Supabase storage
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET as string)
    .remove([`${req.user!.id}/${document.fileName}`]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

export default router;
