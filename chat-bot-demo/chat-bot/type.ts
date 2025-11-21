export interface IChatMessage{
  role: "user" | "assistant" | "system";
  content: string;
  image?: string | null;
}