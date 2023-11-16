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
import { CartRepository } from "../repository/cartRepository";
import { CartInput, UpdateCartInput } from "../models/dto/CartInput";
import { CartItemModel } from "../models/CartItemsModel";
import { PullData } from "../message-queue";
import aws from "aws-sdk";
import {
  APPLICATION_FEE,
  CreatePaymentSession,
  RetrivePayment,
  STRIPE_FEE,
} from "../utility/payment";

@autoInjectable()
export class CartService {
  repository: CartRepository;
  constructor(repository: CartRepository) {
    this.repository = repository;
  }

  async ResponseWithError(event: APIGatewayProxyEventV2) {
    return ErrorResponse(404, "requested method is not supported!");
  }

  // Cart Section

  async CreateCart(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");

      const input = plainToClass(CartInput, event.body);
      console.log("input=============>", input);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);
      // DB Operations
      // find the cart
      let currentCart = await this.repository.findShoppingCart(payload.user_id);
      // if does not exist , then create the cart
      if (!currentCart)
        currentCart = await this.repository.createShoppingCart(payload.user_id);

      if (!currentCart) {
        return ErrorResponse(500, "create cart is failed!");
      }

      // find the item if exist
      let currentProduct = await this.repository.findCartItemByProductId(
        input.productId
      );
      if (currentProduct) {
        // if exists update the qty
        await this.repository.updateCartItemByProductId(
          input.productId,
          (currentProduct.item_qty += input.qty)
        );
      } else {
        // if does not, call product service to get produt information
        const { data, status } = await PullData({
          action: "PULL_PRODUCT_DATA",
          productId: input.productId,
        });

        if (status != 200) {
          return ErrorResponse(500, "failed to get product data!");
        }
        let cartItem = data.data as CartItemModel;

        cartItem.cart_id = currentCart.cart_id;
        cartItem.item_qty = input.qty;
        //  finally create cart item
        await this.repository.createCartItem(cartItem);
      }

      // return all cart items to client

      const cartItems = await this.repository.findCartItemsByCartId(
        currentCart.cart_id
      );
      console.log(cartItems, "===============>");
      return SuccessResponse(cartItems);
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async GetCart(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const cartItems = await this.repository.findCartItems(payload.user_id);

      //calculate total amount to be paid
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.item_qty,
        0
      );

      const appFee = APPLICATION_FEE(totalAmount) + STRIPE_FEE(totalAmount);
      return SuccessResponse({ cartItems, totalAmount, appFee });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async UpdateCart(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      const cartItemId = Number(event.pathParameters.id);
      if (!payload) return ErrorResponse(403, "Authorization failed!");

      const input = plainToClass(UpdateCartInput, event.body);
      const error = await AppValidationError(input);
      if (error) return ErrorResponse(404, error);

      const cartItems = await this.repository.updateCartItemById(
        cartItemId,
        input.qty
      );

      if (cartItems) {
        return SuccessResponse(cartItems);
      }
      return ErrorResponse(404, "items does not exist!");
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async DeleteCart(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      const cartItemId = Number(event.pathParameters.id);
      if (!payload) return ErrorResponse(403, "Authorization failed!");

      const deletedItem = await this.repository.deleteCartItem(cartItemId);
      return SuccessResponse(deletedItem);
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async CollectPayment(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const { stripe_id, email, phone } =
        await new UserRepository().getUserProfile(payload.user_id);
      const cartItems = await this.repository.findCartItems(payload.user_id);

      //calculate total amount to be paid
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.item_qty,
        0
      );

      const appFee = APPLICATION_FEE(total);
      const stripeFee = STRIPE_FEE(total);
      const amount = 10 + appFee + stripeFee;
      // initialize Payment gateway
      const { secret, publishableKey, customerId, paymentId } =
        await CreatePaymentSession({
          amount,
          email,
          phone,
          customerId: stripe_id,
        });

      await new UserRepository().updateUserPayment({
        userId: payload.user_id,
        paymentId,
        customerId,
      });
      // Authenticate payment confirmation
      return SuccessResponse({ secret, publishableKey });
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }

  async PlaceOrder(event: APIGatewayProxyEventV2) {
    try {
      const token = event.headers.authorization;
      const payload = await VerifyToken(token);
      // Get cart items
      if (!payload) return ErrorResponse(403, "Authorization failed!");
      const { payment_id } = await new UserRepository().getUserProfile(
        payload.user_id
      );
      const paymentInfo = await RetrivePayment(payment_id);
      if (paymentInfo.status === "succeeded") {
        // const cartItems = await this.repository.findCartItems(payload.user_id);
        // // Send SNS topic to create order [Transaction Microservice] => email to user
        // const params = {
        //   Message: JSON.stringify(cartItems),
        //   TopicArn: process.env.SNS_TOPIC,
        //   MessageAttributes: {
        //     actionType: {
        //       DataType: "String",
        //       StringValue: "place_order",
        //     },
        //   },
        // };

        // const sns = new aws.SNS();
        // const response = await sns.publish(params).promise();
        // console.log(response);
        return SuccessResponse({ msg: "success", paymentInfo });
      }
      // Send tentative message to user
      return ErrorResponse(503, new Error("Payment failed"));
    } catch (error) {
      console.log(error);
      return ErrorResponse(500, error);
    }
  }
}
