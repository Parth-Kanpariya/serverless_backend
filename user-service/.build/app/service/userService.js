"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.UserService = void 0;
const SignupInput_1 = require("../models/dto/SignupInput");
const userRepository_1 = require("../repository/userRepository");
const response_1 = require("../utility/response");
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const error_1 = require("../utility/error");
const password_1 = require("../utility/password");
const LoginInput_1 = require("../models/dto/LoginInput");
const notification_1 = require("../utility/notification");
const UpdateInput_1 = require("../models/dto/UpdateInput");
const dateHelper_1 = require("../utility/dateHelper");
const AddressInput_1 = require("../models/dto/AddressInput");
let UserService = exports.UserService = class UserService {
    constructor(repository) {
        this.repository = repository;
    }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "requested method is not supported!");
        });
    }
    // USer Creation, Validation & Login
    CreateUser(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(SignupInput_1.SignupInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                const salt = yield (0, password_1.GetSalt)();
                const hashedPassword = yield (0, password_1.GetHashedPassword)(input.password, salt);
                const data = yield this.repository.createAccount({
                    email: input.email,
                    phone: input.phone,
                    password: hashedPassword,
                    user_type: "BUYER",
                    salt: salt,
                });
                const token = (0, password_1.GetToken)(data);
                return (0, response_1.SuccessResponse)({
                    token,
                    email: data.email,
                    firstName: data.first_name,
                    lastName: data.lastname,
                    phone: data.phone,
                    userType: data.user_type,
                    _id: data.user_id,
                });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    UserLogin(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = (0, class_transformer_1.plainToClass)(LoginInput_1.LoginInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                const data = yield this.repository.findAccount(input.email);
                const verified = (0, password_1.ValidatePassword)(input.password, data.password, data.salt);
                if (!verified) {
                    throw new Error("Password doesn't match!");
                }
                const token = (0, password_1.GetToken)(data);
                return (0, response_1.SuccessResponse)({
                    token,
                    email: data.email,
                    firstName: data.first_name,
                    lastName: data.lastname,
                    phone: data.phone,
                    userType: data.user_type,
                    _id: data.user_id,
                });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    GetVerificationToken(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "Authorization failed!");
                const { code, expiry } = (0, notification_1.GenerateAccessCode)();
                //save on DB to confirm verification
                yield this.repository.updateVerificationCode(payload.user_id, code, expiry);
                const response = yield (0, notification_1.SendVerificationCode)(code, payload.phone);
                return (0, response_1.SuccessResponse)({
                    message: "verification code is sent to your mobile number!",
                });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    VerifyUser(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "Authorization failed!");
                const input = (0, class_transformer_1.plainToClass)(UpdateInput_1.VerificationInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                const { verification_code, expiry } = yield this.repository.findAccount(payload.email);
                // find the user account
                if (verification_code === parseInt(input.code)) {
                    // check expiry
                    const currentTime = new Date();
                    const diff = (0, dateHelper_1.TimeDifference)(expiry, currentTime.toISOString(), "m");
                    if (diff > 0) {
                        yield this.repository.updateVerifyUser(payload.user_id);
                    }
                    else {
                        return (0, response_1.ErrorResponse)(403, "verification code is expired!");
                    }
                }
                return (0, response_1.SuccessResponse)({ message: "User verified" });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    // User Profile
    CreateProfile(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "Authorization failed!");
                const input = (0, class_transformer_1.plainToClass)(AddressInput_1.ProfileInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                // DB Operations
                const result = yield this.repository.createProfile(payload.user_id, input);
                return (0, response_1.SuccessResponse)({ message: "Profile created!" });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    GetProfile(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "Authorization failed!");
                const result = yield this.repository.getUserProfile(payload.user_id);
                return (0, response_1.SuccessResponse)(result);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    EditProfile(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "Authorization failed!");
                const input = (0, class_transformer_1.plainToClass)(AddressInput_1.ProfileInput, event.body);
                const error = yield (0, error_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                // DB Operations
                yield this.repository.editProfile(payload.user_id, input);
                return (0, response_1.SuccessResponse)({ message: "Profile Updated!" });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    // Payment Section
    CreatePayment(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.SuccessResponse)({ message: "Response from Create User Payment" });
        });
    }
    GetPayment(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.SuccessResponse)({ message: "Response from Get User Payment" });
        });
    }
};
exports.UserService = UserService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [userRepository_1.UserRepository])
], UserService);
//# sourceMappingURL=userService.js.map