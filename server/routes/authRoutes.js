const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { jwtkey } = require("../keys");
const router = express.Router();
const User = mongoose.model("User");
const Admin = mongoose.model("Admin");

router.get("/sendMail/:adminId", async (req, res) => {
  console.log("Send Mail Req Received!");
  const { adminId } = req.params;
  console.log(adminId);
  await Admin.findOne({ _id: adminId }, async (err, admin) => {
    const email = admin.email;
    console.log(email);
    if (err) {
      console.log("Mail Not FOund");
    } else {
      console.log("Email Found!");
      res.send("Email Found!");
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "mh972240@gmail.com",
          pass: "Hafni++mesa!gmail",
        },
      });

      let mailOptions = {
        from: "mh972240@gmail.com",
        to: email,
        subject: "Auto Grocery App",
        cc: "Muhammad Haris",
        bcc: "AMmar Ahmed",
        text: "Jar is Full",
      };

      transporter
        .sendMail(mailOptions)
        .then(function (response) {
          console.log("Email Sent!");
          res.send("res sent!");
        })
        .catch(function (error) {
          console.log("Error: ", error);
        });
    }
  });
});

router.post("/adminSignin", async (req, res) => {
  console.log("admin lognin request Received");
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).send({ error: "must provide email and password1" });
  }
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(422).send({ error: "This user Doesn't Exist" });
  }
  try {
    await admin.comparePassword(password);

    const token = jwt.sign({ adminId: admin._id }, jwtkey, {
      expiresIn: "30days",
    });
    const adminId = admin.id;
    const storageData = [adminId, token];
    res.send(storageData);
  } catch (err) {
    return res.status(422).send({ error: "Something is wrong" });
  }
});

router.get("/getJarsArray/:adminId", function (req, res) {
  console.log("I reached jars array route");
  const id = req.params.adminId;
  Admin.find({ _id: id }, function (err, adminUsers) {
    var responseArray = [];
    for (var i = 0; i < adminUsers.length; i++) {
      for (var j = i; j < adminUsers[i].jars.length; j++) {
        var newRes = {
          jars: adminUsers[i].jars[j],
        };
        responseArray.push(newRes);
      }
    }
    console.log(responseArray);
    res.send(responseArray);
  });
});

router.put("/deleteJarItem/:adminId/:jarName", function (req, res) {
  console.log("I reached delete jar item route");
  const id = req.params.adminId;
  const jarName = req.params.jarName;
  Admin.findOne({ _id: id }, async (err, adminUsers) => {
    const jar_index = adminUsers.jars;
    console.log(jar_index.indexOf(jarName));
    const jarIndex = jar_index.indexOf(jarName);

    var handleCaseArray = [];
    var newJarArray = [];

    if (jarIndex === 0) {
      handleCaseArray = adminUsers.jars;
      handleCaseArray.shift();
      newJarArray = handleCaseArray;
      console.log("First Case: " + newJarArray);
    } else if (jarIndex + 1 === adminUsers.jars.length) {
      handleCaseArray = adminUsers.jars;
      handleCaseArray.pop();
      newJarArray = handleCaseArray;
      console.log("Second Case: " + newJarArray);
    } else {
      var firstArray = [];
      var secondArray = [];
      firstArray = adminUsers.jars.slice(0, jarIndex);
      console.log("i am first array  :" + firstArray);
      secondArray = adminUsers.jars.slice(jarIndex + 1);
      console.log("i am second array :" + secondArray);
      newJarArray = firstArray.concat(secondArray);
      console.log("Third Case: " + newJarArray);
    }
    const updatedJars = await Admin.updateOne(
      { _id: id },
      { jars: newJarArray }
    );

    res.send(updatedJars);
  });
});

router.put("/addJar/:adminId", function (req, res) {
  console.log("I reached add jar item route");
  const id = req.params.adminId;
  const toBeAdded = req.body.jarName;

  Admin.findOne({ _id: id }, async (err, adminUsers) => {
    const jarsArray = adminUsers.jars;
    jarsArray.push(toBeAdded);
    const updatedJars = await Admin.updateOne({ _id: id }, { jars: jarsArray });
    res.send(updatedJars);
  });
});

router.get("/getAdminUsers/:adminId", function (req, res) {
  console.log("I reached admin's users route");
  const id = req.params.adminId;
  console.log(id);
  User.find({ admin: id }, function (err, adminUsers) {
    var newUsersInfo = [];
    var newUser = {
      userName: "",
      userEmail: "",
      contact: "",
    };
    for (i = 0; i < adminUsers.length; i++) {
      newUser = {
        userName: adminUsers[i].name,
        userEmail: adminUsers[i].email,
        contact: adminUsers[i].contact,
      };
      newUsersInfo[i] = newUser;
    }
    res.send(newUsersInfo);
  });
});

router.post("/userSignin", async (req, res) => {
  console.log("user lognin request Received");
  const { email, password } = req.body;
  console.log("im server side email: " + email);
  if (!email || !password) {
    return res.status(422).send({ error: "must provide email and password1" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).send({ error: "This user Doesn't Exist" });
  }
  try {
    await user.comparePassword(password);

    const token = jwt.sign({ userId: user._id }, jwtkey, {
      expiresIn: "30days",
    });
    const userId = user.id;
    const adminId = user.admin;
    const storageData = [userId, adminId, token];
    res.send(storageData);
  } catch (err) {
    return res.status(422).send({ error: "Something is wrong" });
  }
});

router.get("/see", async (req, res) => {
  console.log("see request received");
  const user = await Admin.find({}).populate({ path: "user", model: "User" });
  res.json(user);
});

router.post("/adminSignup", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin signup request received");
  const { name, email, contact, password, jars } = req.body;
  try {
    const admin = new Admin({
      name,
      email,
      contact,
      password,
      jars,
      user: [],
    });
    await admin.save();
    const token = jwt.sign({ adminId: admin._id }, jwtkey);
    console.log(token);
    res.send({ token });
  } catch (err) {
    return res.send(err);
  }
});

router.post("/createUser/:adminId", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin ID: " + req.params.adminId);
  console.log("user signup request received");
  const { name, email, contact, password } = req.body;

  try {
    const user = new User({
      name,
      email,
      contact,
      password,
      admin: mongoose.Types.ObjectId(req.params.adminId.toString()),
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, jwtkey);

    const assignUser = await User.findOne({
      email: email,
    });
    console.log(assignUser);
    const admin = await Admin.findOne({ _id: req.params.adminId });
    let userArray = admin.user;
    userArray.push(mongoose.Types.ObjectId(assignUser.id));
    console.log(userArray);
    const updated = await Admin.updateOne(
      { _id: req.params.adminId },
      { user: userArray }
    );
    console.log(token);
    res.send({ token });
  } catch (err) {
    return res.send(err);
  }
});

module.exports = router;
