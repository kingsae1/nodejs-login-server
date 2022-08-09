const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser"); // body-parser 요청
const app = express();
const fs = require("fs");
const port = process.env.PORT || 3000;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uri =
  "mongodb+srv://kingsae1:102938@cluster0.rcdrcap.mongodb.net/?retryWrites=true&w=majority";
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
  return new Promise((resolve, reject) => {
    UserModel.find({ id: data.id }).then((user) => {
      console.log("[checkToExistId] user", user);
      resolve({ ...data, status: user.length > 0 ? "EXIST" : "NOT_FOUND" });
    });
  });
};

const signUpId = ({ id, password, email }) => {
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
});
