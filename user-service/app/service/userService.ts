import { SignupInput } from "../models/dto/SignupInput";
import { UserRepository } from "../repository/userRepository";
import { SuccessResponse, ErrorResponse } from "../utility/response";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { autoInjectable } from "tsyringe";
import { plainToClass } from "class-transformer";
import { AppValidationError } from "../utility/error";
import {
  GetHashedPassword,
  GetSalt,
  GetToken,
  ValidatePassword,
  VerifyToken,
} from "../utility/password";
import { LoginInput } from "../models/dto/LoginInput";
import {
  GenerateAccessCode,
  SendVerificationCode,
} from "../utility/notification";
import { VerificationInput } from "../models/dto/UpdateInput";
import { TimeDifference } from "../utility/dateHelper";
import { ProfileInput } from "../models/dto/AddressInput";

@autoInjectable()
export class UserService {
  repository: UserRepository;
  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  async ResponseWithError(event: APIGatewayProxyEventV2) {
    return ErrorResponse(404, "requested method is not supported!");
  }

  // USer Creation, Validation & Login
  async CreateUser(event: APIGatewayProxyEventV2) {
    try {
      const input = plainToClass(SignupInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);
      const salt = await GetSalt();
      const hashedPassword = await GetHashedPassword(input.password, salt);
      const data = await this.repository.createAccount({
        email: input.email,
        phone: input.phone,
        password: hashedPassword,
        user_type: "BUYER",
        salt: salt,
      });
      const token = GetToken(data);
      return SuccessResponse({
        token,
        email: data.email,
        firstName: data.first_name,
        lastName: data.lastname,
        phone: data.phone,
        userType: data.user_type,
        _id: data.user_id,
      });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async UserLogin(event: APIGatewayProxyEventV2) {
    try {
      const input = plainToClass(LoginInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);
      const data = await this.repository.findAccount(input.email);
      const verified = ValidatePassword(
        input.password,
        data.password,
        data.salt
      );
      if (!verified) {
        throw new Error("Password doesn't match!");
      }
      const token = GetToken(data);
      return SuccessResponse({
        token,
        email: data.email,
        firstName: data.first_name,
        lastName: data.lastname,
        phone: data.phone,
        userType: data.user_type,
        _id: data.user_id,
      });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async GetVerificationToken(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);

      if (!payload) return ErrorResponse(403, "Authorization failed!");

      const { code, expiry } = GenerateAccessCode();
      //save on DB to confirm verification
      await this.repository.updateVerificationCode(
        payload.user_id,
        code,
        expiry
      );
      const response = await SendVerificationCode(code, payload.phone);
      return SuccessResponse({
        message: "verification code is sent to your mobile number!",
      });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async VerifyUser(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const input = plainToClass(VerificationInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);

      const { verification_code, expiry } = await this.repository.findAccount(
        payload.email
      );
      // find the user account
      if (verification_code === parseInt(input.code)) {
        // check expiry
        const currentTime = new Date();
        const diff = TimeDifference(expiry, currentTime.toISOString(), "m");
        if (diff > 0) {
          await this.repository.updateVerifyUser(payload.user_id);
        } else {
          return ErrorResponse(403, "verification code is expired!");
        }
      }

      return SuccessResponse({ message: "User verified" });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  // User Profile
  async CreateProfile(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const input = plainToClass(ProfileInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);
      // DB Operations
      const result = await this.repository.createProfile(
        payload.user_id,
        input
      );
      return SuccessResponse({ message: "Profile created!" });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async GetProfile(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const result = await this.repository.getUserProfile(payload.user_id);
      return SuccessResponse(result);
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async EditProfile(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");

      const input = plainToClass(ProfileInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);
      // DB Operations
      await this.repository.editProfile(payload.user_id, input);
      return SuccessResponse({ message: "Profile Updated!" });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  // Payment Section

  async CreatePayment(event: APIGatewayProxyEventV2) {
    return SuccessResponse({ message: "Response from Create User Payment" });
  }

  async GetPayment(event: APIGatewayProxyEventV2) {
    return SuccessResponse({ message: "Response from Get User Payment" });
  }
}
