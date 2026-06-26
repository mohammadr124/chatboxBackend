import express from "express";
import {
  reqisterFunc,
  loginFunc,
  getMeFunc,
  logOutFun,
  serchUserFunc,
  updateAvatarHandeler,
  getOneUser
} from "../controllers/user-controller";
import uploader from "../middleware/multer";
import registerMiddleware from "../middleware/register-middleware";
import loginMiddleware from "../middleware/login-middleware";
import checkTokenMiddleware from "../middleware/check-token-middleware";

const userRouter = express.Router();

userRouter.post("/register", uploader.none(), registerMiddleware, reqisterFunc);
userRouter.post("/log-in", uploader.none(), loginMiddleware, loginFunc);
userRouter.get("/get-me", checkTokenMiddleware, getMeFunc);
userRouter.delete("/log-out", logOutFun);
userRouter.post("/serch", serchUserFunc);
userRouter.put("/update/:id", updateAvatarHandeler);
userRouter.get("/:id", getOneUser);

export = userRouter;
