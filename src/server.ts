import express, { Application } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import userRouter from "./router/user";
import chatRouter from "./router/chat";
import otpRouter from "./router/otp";
import messageRouter from "./router/message";
import { log } from "console";
import { connectToDb } from "./utils/connection";
import { isValidObjectId } from "mongoose";
import chatModel from "./models/chat";
import messageModel from "./models/message";

const app: Application = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(cookieParser());

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/otp-code", otpRouter);
app.use("/api/message", messageRouter);

io.on("connection", (socket: Socket) => {
  console.log("socket connected:", socket.id);

  socket.on("sendId", async (chatId: string) => {
    await connectToDb();

    try {
      if (!chatId || !isValidObjectId(chatId)) {
        socket.emit("error", "آی دی نامعتبر است");
        return;
      }

      // 🔥 join room
      socket.join(chatId);

      const chat = await chatModel
        .findById(chatId, "-__v")
        .populate("members", "-__v")
        .lean();

      if (!chat) {
        socket.emit("error", "چت پیدا نشد");
        return;
      }

      const messages = await messageModel.find(
        { whatChat: chatId },
        "-__v"
      );

      socket.emit("getChatData", {
        ...chat,
        messages,
      });
    } catch (error) {
      console.log("sendId error:", error);
      socket.emit("error", "خطای سرور");
    }
  });

  socket.on("message", async (messageData: any) => {
    await connectToDb();

    try {
      const {
        messageValue,
        messageAuthor,
        messageReceiver,
        whatChat,
      } = messageData;

      if (
        !messageValue ||
        !isValidObjectId(messageAuthor) ||
        !isValidObjectId(messageReceiver) ||
        !isValidObjectId(whatChat)
      ) {
        socket.emit("error", "اطلاعات پیام نامعتبر است");
        return;
      }

      const newMessage = await messageModel.create({
        messageValue,
        messageAuthor,
        messageReceiver,
        whatChat,
      });

      // 🔥 فقط برای اعضای همان چت
      io.to(whatChat).emit("message", newMessage);

    } catch (error) {
      console.log("message error:", error);
      socket.emit("error", "خطای سرور");
    }
  }); 
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
