import { plainToClass } from "class-transformer";
import { SellerRepository } from "../repository/sellerRepository";
import { GetToken, VerifyToken } from "../utility/password";
import { ErrorResponse, SuccessResponse } from "../utility/response";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  PaymentMethodInput,
  SellerProgramInput,
} from "../models/dto/JoinSellerProgramInput";
import { AppValidationError } from "../utility/error";

export class SellerService {
  repository: SellerRepository;
  constructor(repository: SellerRepository) {
    this.repository = repository;
  }

  async JoinSellerProgram(event: APIGatewayProxyEventV2) {
    try {
      const authToken = event.headers.authorization;
      const payload = await VerifyToken(authToken);
      if (!payload) return ErrorResponse(403, "authorization failed!");
      const input = plainToClass(SellerProgramInput, event.body);
      const error = await AppValidationError(input);
      if (error) {
        console.log("======>");
        return ErrorResponse(404, error);
      }
      const { firstName, lastName, phoneNumber, address } = input;
      const enrolled = await this.repository.checkEnrolledProgram(
        payload.user_id
      );
      if (enrolled) {
        return ErrorResponse(
          403,
          "You have already enrolled for seller program!, you can sell your products now!"
        );
      }
      // update user program
      const updatedUser = await this.repository.updateProfile({
        firstName,
        lastName,
        phoneNumber,
        user_id: payload.user_id,
      });
      if (!updatedUser) {
        return ErrorResponse(500, "error on joinig seller program!!");
      }
      // UPDATE ADDRESS
      await this.repository.updateAddress({
        ...address,
        user_id: payload.user_id,
      });

      // create payment method
      const result = await this.repository.createPaymentMethod({
        ...input,
        user_id: payload.user_id,
      });

      // signed token
      if (result) {
        const token = GetToken(updatedUser);
        return SuccessResponse({
          message: "successfully joined seller program!!",
          seller: {
            token,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.lastname,
            phone: updatedUser.phone,
            userType: updatedUser.user_type,
            _id: updatedUser.user_id,
          },
        });
      } else {
        return ErrorResponse(500, "error on joining seller program!!");
      }
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async GetPaymentMethods(event: APIGatewayProxyEventV2) {
    try {
      const authToken = event.headers.authorization;
      const payload = await VerifyToken(authToken);
      if (!payload) return ErrorResponse(403, "authorization failed!");
      const paymentMethods = await this.repository.getPaymentMethods(
        payload.user_id
      );
      return SuccessResponse({ paymentMethods });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async EditPaymentMethods(event: APIGatewayProxyEventV2) {
    try {
      const authToken = event.headers.authorization;
      const payload = await VerifyToken(authToken);
      if (!payload) return ErrorResponse(403, "authorization failed!");
      const input = plainToClass(PaymentMethodInput, event.body);
      const error = await AppValidationError(input);
      if (error) {
        return ErrorResponse(404, error);
      }
      const paymentId = Number(event.pathParameters.id);
      const result = await this.repository.updatePaymentMethod({
        ...input,
        payment_id: paymentId,
        user_id: payload.user_id,
      });

      if (result) {
        return SuccessResponse({
          message: "payment method updated!",
        });
      } else {
        return ErrorResponse(500, "error on joining seller program!");
      }
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }
}
