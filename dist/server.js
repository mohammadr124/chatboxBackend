"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const user_1 = __importDefault(require("./router/user"));
const chat_1 = __importDefault(require("./router/chat"));
const otp_1 = __importDefault(require("./router/otp"));
const message_1 = __importDefault(require("./router/message"));
const connection_1 = require("./utils/connection");
const mongoose_1 = require("mongoose");
const chat_2 = __importDefault(require("./models/chat"));
const message_2 = __importDefault(require("./models/message"));
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
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
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use((0, cookie_parser_1.default)());
app.use("/api/user", user_1.default);
app.use("/api/chat", chat_1.default);
app.use("/api/otp-code", otp_1.default);
app.use("/api/message", message_1.default);
io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);
    // ================= JOIN CHAT =================
    socket.on("sendId", async (chatId) => {
        await (0, connection_1.connectToDb)();
        try {
            if (!chatId || !(0, mongoose_1.isValidObjectId)(chatId)) {
                socket.emit("error", "آی دی نامعتبر است");
                return;
            }
            // 🔥 join room
            socket.join(chatId);
            const chat = await chat_2.default
                .findById(chatId, "-__v")
                .populate("members", "-__v")
                .lean();
            if (!chat) {
                socket.emit("error", "چت پیدا نشد");
                return;
            }
            const messages = await message_2.default.find({ whatChat: chatId }, "-__v");
            socket.emit("getChatData", {
                ...chat,
                messages,
            });
        }
        catch (error) {
            console.log("sendId error:", error);
            socket.emit("error", "خطای سرور");
        }
    });
    socket.on("message", async (messageData) => {
        await (0, connection_1.connectToDb)();
        try {
            const { messageValue, messageAuthor, messageReceiver, whatChat, } = messageData;
            if (!messageValue ||
                !(0, mongoose_1.isValidObjectId)(messageAuthor) ||
                !(0, mongoose_1.isValidObjectId)(messageReceiver) ||
                !(0, mongoose_1.isValidObjectId)(whatChat)) {
                socket.emit("error", "اطلاعات پیام نامعتبر است");
                return;
            }
            const newMessage = await message_2.default.create({
                messageValue,
                messageAuthor,
                messageReceiver,
                whatChat,
            });
            // 🔥 فقط برای اعضای همان چت
            io.to(whatChat).emit("message", newMessage);
        }
        catch (error) {
            console.log("message error:", error);
            socket.emit("error", "خطای سرور");
        }
    });
});
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map