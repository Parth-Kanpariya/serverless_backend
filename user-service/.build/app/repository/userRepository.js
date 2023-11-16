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
exports.UserRepository = void 0;
const dbOperation_1 = require("./dbOperation");
class UserRepository extends dbOperation_1.DBOperation {
    constructor() {
        super();
    }
    createAccount({ email, phone, password, user_type, salt }) {
        return __awaiter(this, void 0, void 0, function* () {
            //DB operations
            const queryString = "INSERT INTO users(phone, email, password,user_type,salt) VALUES ($1, $2, $3, $4, $5) RETURNING *";
            const values = [phone, email, password, user_type, salt];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
        });
    }
    findAccount(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryString = "SELECT user_id, email, password, phone, salt, verification_code, expiry, user_type FROM users where email=$1";
            const values = [email];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount < 1) {
                throw new Error("User does not exist with provided email Id!");
            }
            return result.rows[0];
        });
    }
    updateVerificationCode(userId, code, expiry) {
        return __awaiter(this, void 0, void 0, function* () {
            //DB operations
            const queryString = "UPDATE users SET verification_code=$1, expiry=$2 WHERE user_id=$3 AND verified=FALSE RETURNING *";
            const values = [code, expiry, userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("user already verified!");
        });
    }
    updateVerifyUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            //DB operations
            const queryString = "UPDATE users SET verified=TRUE WHERE user_id=$1 AND verified=FALSE RETURNING *";
            const values = [userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("user already verified!");
        });
    }
    updateUser(user_id, firstName, lastName, userType) {
        return __awaiter(this, void 0, void 0, function* () {
            //DB operations
            const queryString = "UPDATE users SET first_name=$1, lastname=$2, user_type=$3 WHERE user_id=$4 RETURNING *";
            const values = [firstName, lastName, userType, user_id];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while updating user!");
        });
    }
    createProfile(user_id, { firstName, lastName, userType, address: { addressLine1, addressLine2, city, postCode, country }, }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateUser(user_id, firstName, lastName, userType);
            const queryString = "INSERT INTO address(user_id, address_line1, address_line2, city, post_code, country ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
            const values = [
                user_id,
                addressLine1,
                addressLine2,
                city,
                postCode,
                country,
            ];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while creating profile!");
        });
    }
    getUserProfile(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const profileQuery = "SELECT first_name, lastname, email, phone, user_type, stripe_id, payment_id, verified FROM users WHERE user_id=$1";
            const profileValues = [user_id];
            const profileResult = yield this.executeQuery(profileQuery, profileValues);
            if (profileResult.rowCount < 1) {
                throw new Error("user profile does not exist!");
            }
            const userProfile = profileResult.rows[0];
            const addressQuery = "SELECT address_line1, address_line2, city, post_code, country,id FROM address WHERE user_id=$1";
            const addressValues = [user_id];
            const addressResults = yield this.executeQuery(addressQuery, addressValues);
            if (addressResults.rowCount > 0) {
                userProfile.address = addressResults.rows;
            }
            return userProfile;
        });
    }
    editProfile(user_id, { firstName, lastName, userType, address: { addressLine1, addressLine2, city, postCode, country, id }, }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateUser(user_id, firstName, lastName, userType);
            const addressQuery = "UPDATE address SET address_line1=$1, address_line2=$2, city=$3, post_code=$4, country=$5 WHERE id=$6";
            const addressValues = [
                addressLine1,
                addressLine2,
                city,
                postCode,
                country,
                id,
            ];
            const addressResults = yield this.executeQuery(addressQuery, addressValues);
            if (addressResults.rowCount < 1) {
                throw new Error("error while updating profile!");
            }
            return true;
        });
    }
    updateUserPayment({ userId, paymentId, customerId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            //DB operations
            const queryString = "UPDATE users SET stripe_id=$1, payment_id=$2 WHERE user_id=$3 RETURNING *";
            const values = [customerId, paymentId, userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while updating user Payment!");
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=userRepository.js.map