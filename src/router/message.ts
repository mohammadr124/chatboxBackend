import express  from "express"
import { createMessage } from "../controllers/message-controllers"

const messageRouter = express.Router() 
messageRouter.post("/create", createMessage)

export default messageRouter