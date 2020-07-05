interface IIncomingMessage {
  chatId: string;
  message: string;
}

interface IOutcomeMessage {
  chatId: string;
  user: string;
  timestamp: Date;
  message: string;
}

interface IUserDisconnected {
  chatId: string;
  user: string;
  timestamp: Date;
}

interface IUserTyping {
  chatId: string;
  user: string;
}

export { IIncomingMessage, IOutcomeMessage, IUserDisconnected, IUserTyping };
