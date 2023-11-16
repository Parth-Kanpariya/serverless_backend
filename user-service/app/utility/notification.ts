import twilio from "twilio";

const accountSid = "ACb9716ad8f287d0a22e34c4f95b643891";
const authToken = "9354edb008a79d00724783b6e01bbc0f";

const client = twilio(accountSid, authToken);
export const GenerateAccessCode = () => {
  const code = Math.floor(1000 + Math.random() * 1000);
  let expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000);
  return { code, expiry };
};

export const SendVerificationCode = async (
  code: number,
  toPhoneNumber: string
) => {
  //+13344907497

  const response = await client.messages.create({
    body: `Your verification code is ${code}, It will expires within 30 minutes`,
    from: "+13344907497",
    to: toPhoneNumber.trim(),
  });

  return response;
};
