import express, { Application } from "express";
import { Server as SocketServer, listen, Socket } from "socket.io";
import { Server, createServer } from "http";
import { v4 as uuid } from "uuid";

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

class App {
  public app: Application;
  public server: Server;
  public socket: SocketServer;
  private poolPerson: Array<Socket> = [];

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.socket = listen(this.server);

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
          const roomId = uuid();
          const users = [stranger, socket];
          users.forEach((user) => {
            user.join(roomId);
            this.socket.to(user.id).emit("room-subscribed", roomId);
            this.poolPerson = this.poolPerson.filter((e) => e.id !== user.id);
          });
        } else {
          this.poolPerson.push(socket);
        }
      });

      socket.on("chat-message", ({ chatId, message }: IIncomingMessage) => {
        const outMessage: IOutcomeMessage = {
          timestamp: new Date(),
          user: socket.id,
          message,
          chatId,
        };
        socket.to(chatId).emit("chat-message", outMessage);
      });

      socket.on("chat-exit", (chatId: string) => {
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
      });

      socket.on("chat-typing", (chatId: string)=> {
        console.log(`[${socket.id}] Usuário digitando`);
        const userTyping:IUserTyping = {
            chatId: chatId,
            user:socket.id
        }
        socket.to(chatId).emit("chat-typing", userTyping);
      });
    });
  }
}

export default new App();
