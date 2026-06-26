import type { Request, Response } from "express";
import { connectToDb } from "../utils/connection";
import { log } from "console";
import { isValidObjectId } from "mongoose";
import messageModel from "../models/message";

const createMessage = async (req: Request, res: Response) => {
  await connectToDb();
  try {
    const { messageValue, messageAuthor, messageReceiver, whatChat } = req.body;
    if (
      !messageValue ||
      !isValidObjectId(messageAuthor) ||
      !isValidObjectId(messageReceiver) ||
      !isValidObjectId(whatChat)
    ) {
      return res.status(400).json({ message: "bad request" });
    }

    await messageModel.create({
      messageValue,
      messageAuthor,
      messageReceiver,
      whatChat,
    });

    res.json({ message: "پبام با موفقیت ایجاد شد" });
  } catch (error) {
    log("error in create message api ===>", error);
  }
};

export { createMessage };
