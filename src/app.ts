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
  timestamp: Date;
  message: string;
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
          message,
          chatId,
        };
        socket.to(chatId).emit("chat-message", JSON.stringify(outMessage));
      });

      socket.on("chat-exit", (chatId: string) => {
        socket.leave(chatId);
        socket.to(chatId).emit("chat-exit", chatId);
      });
    });
  }
}

export default new App();
