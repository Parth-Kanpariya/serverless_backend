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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendVerificationCode = exports.GenerateAccessCode = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = "ACb9716ad8f287d0a22e34c4f95b643891";
const authToken = "9354edb008a79d00724783b6e01bbc0f";
const client = (0, twilio_1.default)(accountSid, authToken);
const GenerateAccessCode = () => {
    const code = Math.floor(1000 + Math.random() * 1000);
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + 30 * 60 * 1000);
    return { code, expiry };
};
exports.GenerateAccessCode = GenerateAccessCode;
const SendVerificationCode = (code, toPhoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    //+13344907497
    const response = yield client.messages.create({
        body: `Your verification code is ${code}, It will expires within 30 minutes`,
        from: "+13344907497",
        to: toPhoneNumber.trim(),
    });
    return response;
});
exports.SendVerificationCode = SendVerificationCode;
//# sourceMappingURL=notification.js.map