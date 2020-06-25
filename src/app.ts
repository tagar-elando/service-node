import express, { Application } from "express";
import { Server, createServer } from "http";
import ChatSocketServer from "./ChatSocketServer";

class App {
  public app: Application;
  public server: Server;
  private chatSocket : ChatSocketServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.chatSocket = new ChatSocketServer(this.server);
  }
}

export default new App();
