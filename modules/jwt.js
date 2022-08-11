// JWT
// JWT(JSON Web Token - JSON 웹 토큰)은 두 개체 사이에서 안전하게 클레임을 전달
// (표현)해주는 산업 표준 RFC 7519 방법입니다. (JSON Web Tokens are an open, industry
// standard RFC 7519 method for representing claims securely between two parties.)
const CONFIG = require("../config.json");
const randToken = require("rand-token");
const jwt = require("jsonwebtoken");
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const generateAccessToken = (id) => {
  return jwt.sign({ id }, CONFIG.ACCESS_TOKEN_SECRET, CONFIG.OPTIONS);
};

// refersh token을 secret key  기반으로 생성
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, CONFIG.REFRESH_TOKEN_SECRET, CONFIG.OPTIONS);
};

class JWT {
  // Client                         Server
  //   |   - Authorization Grant ->   |
  //   |   <---  Access Token  ---    |
  //   |   ----  Access Token  --->   |
  //   |   <-  Protected Resource -   |
  constructor() {}

  // Sign : 토큰 생성 메소드
  sign(user) {
    // [Payload] 정의된 registerd claim
    // iss : 토큰 발급자 (issuer)
    // sub : 토큰 제목 (subject)
    // aud : 토큰 대상자 (audience)
    // exp : 토큰의 만료시간 (expiration) / 형식은 NumericDate
    // nbf : Not Before 을 의미 / 토큰의 활성 날짜
    const payload = {
      id: user.id,
      email: user.email,
    };
    const result = {
      //sign메소드를 통해 access token 발급!
      // header + payload 정보를 비밀키로 해쉬를 하여 생성!
      // (즉, payload가 바뀌어도 이 값에 영향을 주기 때문에 보안성이 높아짐!)
      // HMACSHA256(
      //     base64UrlEncode(header)
      //     + "."
      //     + base64UrlEncode(payload),
      //     secretkey)
      token: jwt.sign(payload, CONFIG.ACCESS_TOKEN_SECRET, CONFIG.OPTIONS),
      refreshToken: randToken.uid(256),
    };
    return result;
  }

  // Verify : 토큰 확인 메소드
  verify(token) {
    let decoded;
    try {
      // verify를 통해 값 decode!
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.message === "jwt expired") {
        console.log("expired token");
        return TOKEN_EXPIRED;
      } else if (err.message === "invalid token") {
        console.log("invalid token (1)");
        return TOKEN_INVALID;
      } else {
        console.log("invalid token (2)");
        return TOKEN_INVALID;
      }
    }
    return decoded;
  }
}

// singtone으로 유지
module.exports = {
  jwt: new JWT(),
};
