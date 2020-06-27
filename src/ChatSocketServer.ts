import {
  IIncomingMessage,
  IOutcomeMessage,
  IUserTyping,
  IUserDisconnected,
} from "./interfaces";
import { Server as SocketServer, listen, Socket } from "socket.io";
import { Server } from "http";
import { v4 as uuid } from "uuid";

export default class ChatSocketServer {
  private socket: SocketServer;
  private poolPerson: Array<Socket> = [];

  constructor(private server: Server) {
    this.socket = listen(server);
    this.listen();
  }

  private listen() {
    this.socket.on("connection", (socket) => {
      console.log(`[${socket.id}] Usuário conectado`);
      socket.emit("user-info", socket.id);

      socket.on("disconnect", () => {
        console.log(`[${socket.id}] Usuário desconectado`);
      });

      socket.on("new", () => {
        console.log(`[${socket.id}] Solicitou nova sala`);
        const stranger = this.poolPerson.find((e) => e.id !== socket.id);
        if (stranger) {
          this.newRoom(stranger, socket);
        } else {
          this.poolPerson.push(socket);
        }
      });

      socket.on("chat-message", ({ chatId, message }: IIncomingMessage) => {
        this.sendMessage(socket, message, chatId);
      });

      socket.on("chat-exit", (chatId: string) => {
        this.exitRoom(socket, chatId);
      });

      socket.on("chat-typing", (chatId: string) => {
        this.sendTyping(socket, chatId);
      });
    });
  }

  private newRoom(stranger: Socket, socket: Socket) {
    const chatId = uuid();
    const users = [stranger, socket];
    users.forEach((user) => {
      user.join(chatId);
      this.socket.to(user.id).emit("room-subscribed", chatId);
      this.poolPerson = this.poolPerson.filter((e) => e.id !== user.id);
    });
  }

  private sendMessage(socket: Socket, message: string, chatId: string) {
    const outMessage: IOutcomeMessage = {
      timestamp: new Date(),
      user: socket.id,
      message,
      chatId,
    };
    socket.to(chatId).emit("chat-message", outMessage);
  }

  private sendTyping(socket: Socket, chatId: string) {
    const userTyping: IUserTyping = { chatId: chatId, user: socket.id };
    socket.to(chatId).emit("chat-typing", userTyping);
  }

  private exitRoom(socket: Socket, chatId: string) {
    const userDisconnected: IUserDisconnected = {
      user: socket.id,
      timestamp: new Date(),
      chatId,
    };
    const messageToOtherUsers: IOutcomeMessage = {
      ...userDisconnected,
      user: "system",
      message: `Stranger have disconnected.`,
    };

    this.socket.in(chatId).emit("user-disconnected", userDisconnected);
    socket.to(chatId).emit("chat-message", messageToOtherUsers);
    socket.leave(chatId);
    socket.emit("chat-message", {
      ...messageToOtherUsers,
      message: "You have disconnected.",
    });
  }
}
