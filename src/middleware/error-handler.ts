import { NextFunction, Request, Response } from "express";
import { getErrorMessage } from "../utils/helper";
import CustomError from "../errors/CustomError";
import { UnauthorizedError } from "express-oauth2-jwt-bearer";
import { APP_DEBUG } from "../utils/constants.js";

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent || APP_DEBUG) {
    next(error);
    return;
  }

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: "code" in error ? error.code : "ERR_AUTH",
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      message:
        getErrorMessage(error) ||
        "An error occurred. Please view logs for more details",
    },
  });
}
