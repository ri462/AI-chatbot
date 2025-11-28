import type { IChatMessage } from "@/type";
import ChatMessage from "./chatMessage";
interface IProps{
  chatMessages: IChatMessage[];
  onLike?: (index: number) => void;
  onDislike?: (index: number) => void;
}
const ChatMessageArea = ({ chatMessages, onLike, onDislike }: IProps) => {
  return (
    <div className="flex flex-col gap-2 w-screen overflow-auto">
      {chatMessages.map((chatMessage, index) => (
        <div
          key = {index}
          className={`${chatMessage.role === "user" && "justify-end"} ${
            chatMessage.role === "assistant" && "justify-start"
          } flex w-full p-3`}
        >
          <ChatMessage chatMessage={chatMessage} index={index} onLike={onLike} onDislike={onDislike} />
        </div>
      ))}
    </div>
  );
};
export default ChatMessageArea;