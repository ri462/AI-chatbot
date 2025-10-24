"use server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

const client = new OpenAI({
  apiKey: "ollama",
  baseURL: process.env.API_BASE_OLLAMA_URL,
});
export async function aiResponse(messages: ChatCompletionMessageParam[]
): Promise<string | null> {
  if (!messages || messages.length === 0){
    return null;
  }

  const chatCompletion = await client.chat.completions.create({
    messages: messages,
    model: "gemma3:4b",
  });

  const content = chatCompletion.choices[0].message.content|| "";
  //return chatCompletion.choices[0].message.content;
  return content.trim().slice(0,100) + "よっし！";
}