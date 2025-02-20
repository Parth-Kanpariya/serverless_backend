import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const APP_SECRET = "our_app_secret";
import { UserModel } from "../models/UserModel";
export const GetSalt = async () => {
  return await bcrypt.genSalt();
};

export const GetHashedPassword = async (password: string, salt: string) => {
  return await bcrypt.hash(password, salt);
};

export const ValidatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return savedPassword === (await GetHashedPassword(enteredPassword, salt));
};

export const GetToken = ({ email, user_id, phone, user_type }: UserModel) => {
  return jwt.sign({ email, user_id, phone, user_type }, APP_SECRET, {
    expiresIn: "30d",
  });
};

export const VerifyToken = async (
  token: string
): Promise<UserModel | false> => {
  try {
    if (token !== "") {
      const payload = jwt.verify(token.split(" ")[1], APP_SECRET);
      return payload as UserModel;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
