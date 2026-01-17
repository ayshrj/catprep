import { ChatMessage, type ChatMessageProps, type Message } from "@/components/ui/chat-message";
import { LlmChatMessage } from "@/components/ui/llm-chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { isLlmCatCoachResponse } from "@/utils/llm-response";

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>;

interface MessageListProps {
  messages: Message[];
  showTimeStamps?: boolean;
  isTyping?: boolean;
  messageOptions?: AdditionalMessageOptions | ((message: Message) => AdditionalMessageOptions);
}

export function MessageList({ messages, showTimeStamps = true, isTyping = false, messageOptions }: MessageListProps) {
  return (
    <div className="space-y-4 overflow-visible">
      {messages.map(message => {
        const additionalOptions = typeof messageOptions === "function" ? messageOptions(message) : messageOptions;
        const { content, ...messageRest } = message;
        const isLlmMessage = message.role === "assistant" && isLlmCatCoachResponse(content);

        if (isLlmMessage) {
          return (
            <LlmChatMessage
              key={message.id}
              showTimeStamp={showTimeStamps}
              {...messageRest}
              content={content}
              {...additionalOptions}
            />
          );
        }

        return (
          <ChatMessage
            key={message.id}
            showTimeStamp={showTimeStamps}
            {...messageRest}
            content={content}
            {...additionalOptions}
          />
        );
      })}
      {isTyping && <TypingIndicator />}
    </div>
  );
}
