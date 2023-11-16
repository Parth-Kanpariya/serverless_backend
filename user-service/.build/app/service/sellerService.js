"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const class_transformer_1 = require("class-transformer");
const password_1 = require("../utility/password");
const response_1 = require("../utility/response");
const JoinSellerProgramInput_1 = require("../models/dto/JoinSellerProgramInput");
const error_1 = require("../utility/error");
class SellerService {
    constructor(repository) {
        this.repository = repository;
    }
    JoinSellerProgram(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authToken = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(authToken);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization failed!");
                const input = (0, class_transformer_1.plainToClass)(JoinSellerProgramInput_1.SellerProgramInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error) {
                    console.log("======>");
                    return (0, response_1.ErrorResponse)(404, error);
                }
                const { firstName, lastName, phoneNumber, address } = input;
                const enrolled = yield this.repository.checkEnrolledProgram(payload.user_id);
                if (enrolled) {
                    return (0, response_1.ErrorResponse)(403, "You have already enrolled for seller program!, you can sell your products now!");
                }
                // update user program
                const updatedUser = yield this.repository.updateProfile({
                    firstName,
                    lastName,
                    phoneNumber,
                    user_id: payload.user_id,
                });
                if (!updatedUser) {
                    return (0, response_1.ErrorResponse)(500, "error on joinig seller program!!");
                }
                // UPDATE ADDRESS
                yield this.repository.updateAddress(Object.assign(Object.assign({}, address), { user_id: payload.user_id }));
                // create payment method
                const result = yield this.repository.createPaymentMethod(Object.assign(Object.assign({}, input), { user_id: payload.user_id }));
                // signed token
                if (result) {
                    const token = (0, password_1.GetToken)(updatedUser);
                    return (0, response_1.SuccessResponse)({
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
                }
                else {
                    return (0, response_1.ErrorResponse)(500, "error on joining seller program!!");
                }
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    GetPaymentMethods(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authToken = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(authToken);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization failed!");
                const paymentMethods = yield this.repository.getPaymentMethods(payload.user_id);
                return (0, response_1.SuccessResponse)({ paymentMethods });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    EditPaymentMethods(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authToken = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(authToken);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization failed!");
                const input = (0, class_transformer_1.plainToClass)(JoinSellerProgramInput_1.PaymentMethodInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error) {
                    return (0, response_1.ErrorResponse)(404, error);
                }
                const paymentId = Number(event.pathParameters.id);
                const result = yield this.repository.updatePaymentMethod(Object.assign(Object.assign({}, input), { payment_id: paymentId, user_id: payload.user_id }));
                if (result) {
                    return (0, response_1.SuccessResponse)({
                        message: "payment method updated!",
                    });
                }
                else {
                    return (0, response_1.ErrorResponse)(500, "error on joining seller program!");
                }
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
}
exports.SellerService = SellerService;
//# sourceMappingURL=sellerService.js.map