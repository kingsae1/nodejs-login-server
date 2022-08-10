const CONFIG = require("./config.json");
const express = require("express");
const jwt = require("jsonwebtoken");

// JWT
// JWT(JSON Web Token - JSON 웹 토큰)은 두 개체 사이에서 안전하게 클레임을 전달
// (표현)해주는 산업 표준 RFC 7519 방법입니다. (JSON Web Tokens are an open, industry 
// standard RFC 7519 method for representing claims securely between two parties.)

const ejs = require("ejs");
const bodyParser = require("body-parser"); // body-parser 요청
const app = express();
const fs = require("fs");
const port = process.env.PORT || 3000;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uri = `mongodb+srv://${CONFIG.ID}:${CONFIG.PW}@${CONFIG.URL}`;
const index = fs.readFileSync("./public/index.ejs", "utf8");

app.set("view engine", "ejs");
app.set("views", "./public");
app.use(bodyParser.urlencoded({ extended: false })); // urlencoded
app.use(bodyParser.json()); // json 타입으로 파싱하게 설정
app.use(express.static(__dirname + "/public"));

mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log("[Connected] Mongo DB !!!"))
  .catch((e) => console.log(e));

const UserScheme = new Schema({
  id: String,
  password: String,
  email: String,
});
const UserModel = mongoose.model("user", UserScheme);

const checkToExistId = (data) => {
  // DB 조회
  return new Promise((resolve, reject) => {
    UserModel.find({ id: data.id }).then((user) => {
      console.log("[checkToExistId] user", user && user.length > 0);
      resolve({ ...data, status: user.length > 0 ? "EXIST" : "NOT_FOUND" });
    });
  });
};

const signUpId = ({ id, password, email }) => {
  // DB 가입
  console.log("[signUpId] data ", id, password, email);
  return new Promise((resolve, reject) => {
    const newUser = new UserModel({
      id,
      password,
      email,
    });

    newUser.save((err, res) => {
      if (err) {
        console.log("Error ", err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

// refersh token을 secret key  기반으로 생성
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: "180 days",
  });
};

app.get("/", function (req, res) {
  const render = ejs.render(index, { ...req.params });
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(render);
  res.end();
});

app.get("/login", function (req, res) {
  // access token을 secret key 기반으로 생성
  res.json({ accessToken, refreshToken });
});

app.post("/signup", function (req, res) {
  console.log("[Signup] ", req.body);
  new Promise((resolve, reject) => {
    checkToExistId(req.body)
      .then((data) => {
        resolve({
          result: true,
          data: data,
        });
      })
      .catch((e) => {
        reject({ result: false, e, data: { status: "ERROR" } });
      });
  })
    .then((res) => {
      return new Promise((resolve, reject) => {
        if (res.data.status === "NOT_FOUND") {
          signUpId(res.data)
            .then(() => {
              resolve(res);
            })
            .catch((e) => {
              console.log("Error", e);
              reject({ result: false, e, data: { status: "ERROR" } });
            });
        } else {
          resolve(res);
        }
      });
    })
    .then((data) => {
      res.json(data);
    });
});

app.listen(port, function () {
  console.log("[Process] Start WebServer - Port : " + port);
  console.log("[Process] URI : " + uri);
});
