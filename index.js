const CONFIG = require("./config.json");
const express = require("express");

const ejs = require("ejs");
const bodyParser = require("body-parser"); // body-parser 요청
const app = express();
const fs = require("fs");
const port = process.env.PORT || 3000;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uri = `mongodb+srv://${CONFIG.ID}:${CONFIG.PW}@${CONFIG.URL}`;
const index = fs.readFileSync("./public/index.ejs", "utf8");
const test1 = fs.readFileSync("./public/test1.ejs", "utf8");
const test2 = fs.readFileSync("./public/test2.ejs", "utf8");

const { jwt } = require("./modules/jwt");

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

app.get("/test", jwt.verify, function (req, res) {});

app.post("/signin", function (req, result) {
  console.log("[Signup] ", req.body);
  new Promise((resolve, reject) => {
    // ID 조회
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
          // 가입
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
    .then(async (data) => {
      // 가입 또는 로그인
      const token = await jwt.sign(data);
      console.log(token);
      // result.status(200).send({
      //   ...data,
      //   token: token,
      // });

      const render = ejs.render(test1, { token });
      result.writeHead(200, { "Content-Type": "text/html" });
      result.write(render);
      result.end();
    });
});

app.listen(port, function () {
  console.log("[Process] Start WebServer - Port : " + port);
  console.log("[Process] URI : " + uri);
});
