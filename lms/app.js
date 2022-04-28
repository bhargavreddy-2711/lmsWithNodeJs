//include modules
var express = require("express");
app = express();
mongoose = require("mongoose");
expressvalidator = require("express-validator");
session = require("express-session");
methodOverride = require("method-override");
bodyparser = require("body-parser");
passport = require("passport");
LocalStrategy = require("passport-local").Strategy;
passportLocalMongoose = require("passport-local-mongoose");
flash = require("connect-flash");
var moment = require("moment");

  //include models
  Employee = require("./models/employee");
  Techlead = require("./models/techlead");
  Manager = require("./models/manager");
  Leave = require("./models/leave");

  //connect mongodb
var url =process.env.DATABASEURL|| "mongodb://localhost/LeaveApp";
mongoose
  .connect(url, {
    useNewUrlParser: true
  })
  .then(() => {
    console.log("connected to DB");
  })
  .catch(err => {
    console.log("Error:", err.message);
  });

app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(expressvalidator());

//passport config
app.use(
  require("express-session")({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  //   res.locals.currentUser = req.user;
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.user = req.user || null;
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash("error", "You need to be logged in");
    res.redirect("/employee/login");
  }
}
app.get("/", (req, res) => {
  res.render("home");
});

//registration form
app.get("/register", (req, res) => {
  res.render("register");
});
//registration logic
app.post("/employee/register", (req, res) => {
  var type = req.body.type;
  if (type == "employee") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var salary = req.body.salary;
    var department = req.body.department;
    var image = req.body.image;
    //validation
    req.checkBody("name", "name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("salary", "salary is required").notEmpty();
    req.checkBody("department", "department is required").notEmpty();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      // req.session.errors = errors;
      // req.session.success = false;
      console.log("errors: " + errors);
      res.render("register", {
        errors: errors
      });
    }
     else {
      var newEmployee = new Employee({
        name: name,
        username: username,
        password: password,
        department: department,
        salary: salary,
        type: type,
        image: image
      });
      Employee.createEmployee(newEmployee, (err, employee) => {
        if (err) throw err;
        console.log(employee);
      });
      req.flash("success", "you are registered successfully,now you can login");

      res.redirect("/employee/login");
    }
  }
  else if (type == "manager") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var department = req.body.department;
    var image = req.body.image;

    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("password", "password is required").notEmpty();
    req.checkBody("department", "department is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      res.render("register", {
        errors: errors
      });
    } else {
      var newManager = new Manager({
        name: name,
        username: username,
        password: password,
        department: department,
        type: type,
        image: image
      });
      Manager.createManager(newManager, (err, manager) => {
        if (err) throw err;
        console.log(manager);
      });
      req.flash("success", "you are registered successfully,now you can login");

      res.redirect("/manager/login");
    }
  } else if (type == "techlead") {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var salary = req.body.salary;
    var image = req.body.image;

    req.checkBody("name", "Name is required").notEmpty();
    req.checkBody("username", "Username is required").notEmpty();
    req.checkBody("password", "password is required").notEmpty();
    req.checkBody("salary", "salary is required").notEmpty();
    req.checkBody("password2", "Password dont match").equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
      res.render("register", {
        errors: errors
      });
    } else {
      var newTechlead = new Techlead({
        name: name,
        username: username,
        password: password,
        salary: salary,
        type: type,
        image: image
      });
      Techlead.createTechlead(newTechlead, (err, techlead) => {
        if (err) throw err;
        console.log(techlead);
      });
      req.flash("success", "you are registered successfully,now you can login");

      res.redirect("/techlead/login");
    }
  }
});

//stratergies
passport.use(
  "employee",
  new LocalStrategy((username, password, done) => {
    Employee.getUserByUsername(username, (err, employee) => {
      if (err) throw err;
      if (!employee) {
        return done(null, false, { message: "Unknown User" });
      }
      Employee.comparePassword(
        password,
        employee.password,
        (err, passwordFound) => {
          if (err) throw err;
          if (passwordFound) {
            return done(null, employee);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        }
      );
    });
  })
);

passport.use(
  "manager",
  new LocalStrategy((username, password, done) => {
    Manager.getUserByUsername(username, (err, manager) => {
      if (err) throw err;
      if (!manager) {
        return done(null, false, { message: "Unknown User" });
      }
      Manager.comparePassword(password, manager.password, (err, passwordFound) => {
        if (err) throw err;
        if (passwordFound) {
          return done(null, manager);
        } else {
          return done(null, false, { message: "Invalid Password" });
        }
      });
    });
  })
);

passport.use(
  "techlead",
  new LocalStrategy((username, password, done) => {
    Techlead.getUserByUsername(username, (err, techlead) => {
      if (err) throw err;
      if (!techlead) {
        return done(null, false, { message: "Unknown User" });
      }
      Techlead.comparePassword(
        password,
        techlead.password,
        (err, passwordFound) => {
          if (err) throw err;
          if (passwordFound) {
            return done(null, techlead);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        }
      );
    });
  })
);

//srialize

passport.serializeUser(function(user, done) {
  // console.log(user.id);
  done(null, { id: user.id, type: user.type });
});

//deserialize

passport.deserializeUser(function(obj, done) {
  switch (obj.type) {
    case "employee":
      Employee.getUserById(obj.id, function(err, employee) {
        done(err, employee);
      });
      break;
    case "manager":
      Manager.getUserById(obj.id, function(err, manager) {
        done(err, manager);
      });
      break;
    case "techlead":
      Techlead.getUserById(obj.id, function(err, techlead) {
        done(err, techlead);
      });
      break;
    default:
      done(new Error("no entity type:", obj.type), null);
      break;
  }
});

app.get("/employee/login", (req, res) => {
  res.render("login");
});

app.post(
  "/employee/login",
  passport.authenticate("employee", {
    successRedirect: "/employee/home",
    failureRedirect: "/employee/login",
    failureFlash: true
  }),
  (req, res) => {
    // console.log(student);
    res.redirect("/employee/home");
  }
);

app.get("/employee/home", ensureAuthenticated, (req, res) => {
  var employee = req.user.username;
  console.log(employee);
  Employee.findOne({ username: req.user.username })
    .populate("leaves")
    .exec((err, employee) => {
      if (err || !employee) {
        req.flash("error", "employee not found");
        res.redirect("back");
        console.log("err");
      } else {
        res.render("homeemp", {
          employee: employee,
          moment: moment
        });
      }
    });
});
app.get("/employee/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Employee.findById(req.params.id)
    .populate("leaves")
    .exec((err, foundEmployee) => {
      if (err || !foundEmployee) {
        req.flash("error", "Employee not found");
        res.redirect("back");
      } else {
        res.render("profileemp", { employee: foundEmployee });
      }
    });
});
app.get("/employee/:id/edit", ensureAuthenticated, (req, res) => {
  Employee.findById(req.params.id, (err, foundEmployee) => {
    res.render("editE", { employee: foundEmployee });
  });
});
app.put("/employee/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.employee);
  Employee.findByIdAndUpdate(
    req.params.id,
    req.body.employee,
    (err, updatedEmployee) => {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        req.flash("success", "Succesfully updated");
        res.redirect("/employee/" + req.params.id);
      }
    }
  );
});

app.get("/employee/:id/apply", ensureAuthenticated, (req, res) => {
  Employee.findById(req.params.id, (err, foundEmp) => {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      res.render("leaveApply", { employee: foundEmp });
    }
  });
});

app.post("/employee/:id/apply", (req, res) => {
  Employee.findById(req.params.id)
    .populate("leaves")
    .exec((err, employee) => {
      if (err) {
        res.redirect("/employee/home");
      } else {
        date = new Date(req.body.leave.from);
        todate = new Date(req.body.leave.to);
        year = date.getFullYear();
        month = date.getMonth() + 1;
        dt = date.getDate();
        todt = todate.getDate();

        if (dt < 10) {
          dt = "0" + dt;
        }
        if (month < 10) {
          month = "0" + month;
        }
        console.log(todt - dt);
        req.body.leave.days = todt - dt;
        console.log(year + "-" + month + "-" + dt);
        // req.body.leave.to = req.body.leave.to.substring(0, 10);
        console.log(req.body.leave);
        // var from = new Date(req.body.leave.from);
        // from.toISOString().substring(0, 10);
        // console.log("from date:", strDate);
        Leave.create(req.body.leave, (err, newLeave) => {
          if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("back");
            console.log(err);
          } else {
            newLeave.emp.id = req.user._id;
            newLeave.emp.username = req.user.username;
            console.log("leave is applied by--" + req.user.username);

            // console.log(newLeave.from);
            newLeave.save();

            employee.leaves.push(newLeave);

            employee.save();
            req.flash("success", "Successfully applied for leave");
            res.render("homeemp", { employee: employee, moment: moment });
          }
        });
      }
    });
});
app.get("/employee/:id/track", (req, res) => {
  Employee.findById(req.params.id)
    .populate("leaves")
    .exec((err, foundEmp) => {
      if (err) {
        req.flash("error", "No employeee with requested id");
        res.redirect("back");
      } else {

        res.render("trackLeave", { employee: foundEmp, moment: moment });
      }
    });
});
app.get("/manager/login", (req, res) => {
  res.render("managerlogin");
});

app.post(
  "/manager/login",
  passport.authenticate("manager", {
    successRedirect: "/manager/home",
    failureRedirect: "/manager/login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/manager/home");
  }
);
app.get("/manager/home", ensureAuthenticated, (req, res) => {
  Manager.find({}, (err, manager) => {
    if (err) {
      console.log("err");
    } else {
      res.render("homemanager", {
        manager: req.user
      });
    }
  });
});
app.get("/manager/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Manager.findById(req.params.id).exec((err, foundManager) => {
    if (err || !foundManager) {
      req.flash("error", "Manager not found");
      res.redirect("back");
    } else {
      res.render("profilemanager", { manager: foundManager });
    }
  });
});
app.get("/manager/:id/edit", ensureAuthenticated, (req, res) => {
  Manager.findById(req.params.id, (err, foundManager) => {
    res.render("editM", { manager: foundManager });
  });
});

app.put("/manager/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.manager);
  Manager.findByIdAndUpdate(req.params.id, req.body.manager, (err, updatedManager) => {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      req.flash("success", "Succesfully updated");
      res.redirect("/manager/" + req.params.id);
    }
  });
});
app.get("/manager/:id/leave", (req, res) => {
  Manager.findById(req.params.id).exec((err, ManagerFound) => {
    if (err) {
      req.flash("error", "Manager not found with requested id");
      res.redirect("back");
    } else {
      // console.log(hodFound);
      Employee.find({ department: ManagerFound.department })
        .populate("leaves")
        .exec((err, employees) => {
          if (err) {
            req.flash("error", "employee not found with your department");
            res.redirect("back");
          } else {
            // students.forEach(function(student) {
            //   if (student.leaves.length > 0) {
            // student.leaves.forEach(function(leave) {
            //   console.log(leave);
            //   console.log("////////////");
            // Leave.findById(leave, (err, leaveFound) => {
            //   if (err) {
            //     req.flash("error", "leave not found");
            //     res.redirect("back");
            //   } else {
            //     // console.log(leaveFound.subject);
            res.render("managerLeaveSign", {
              manager: ManagerFound,
              employees: employees,
              // leave: leaveFound,
              moment: moment
            });
            //   }
            // });
            // });
            // }
            // Leave.find({ username: student.username }, (err, leave) => {
            //   console.log(leave.username);
            // });
            // });
            // console.log(students);
          }
        });
    }
    // console.log(req.body.hod);
  });
});

app.get("/manager/:id/leave/:emp_id/info", (req, res) => {
  Manager.findById(req.params.id).exec((err, ManagerFound) => {
    if (err) {
      req.flash("error", "hod not found with requested id");
      res.redirect("back");
    } else {
      Employee.findById(req.params.emp_id)
        .populate("leaves")
        .exec((err, foundEmployee) => {
          if (err) {
            req.flash("error", "employee not found with this id");
            res.redirect("back");
          } else {
            res.render("moreinfoemp", {
              employee: foundEmployee,
              manager: ManagerFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.post("/manager/:id/leave/:emp_id/info", (req, res) => {
  Manager.findById(req.params.id).exec((err, ManagerFound) => {
    if (err) {
      req.flash("error", "manager not found with requested id");
      res.redirect("back");
    } else {
      Employee.findById(req.params.emp_id)
        .populate("leaves")
        .exec((err, foundEmployee) => {
          if (err) {
            req.flash("error", "employee not found with this id");
            res.redirect("back");
          } else {
            if (req.body.action === "Approve") {
              foundEmployee.leaves.forEach(function(leave) {
                if (leave.status === "pending") {
                  leave.status = "approved";
                  leave.approved = true;
                  leave.save();
                }
              });
            } else {
              console.log("u denied");
              foundStudent.leaves.forEach(function(leave) {
                if (leave.status === "pending") {
                  leave.status = "denied";
                  leave.denied = true;
                  leave.save();
                }
              });
            }
            res.render("moreinfoemp", {
              employee: foundEmployee,
              manager: ManagerFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.get("/techlead/login", (req, res) => {
  res.render("techleadlogin");
});

app.post(
  "/techlead/login",
  passport.authenticate("techlead", {
    successRedirect: "/techlead/home",
    failureRedirect: "/techlead/login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/techlead/home");
  }
);
app.get("/techlead/home", ensureAuthenticated, (req, res) => {
  Techlead.find({}, (err, manager) => {
    if (err) {
      console.log("err");
    } else {
      res.render("hometechlead", {
        techlead: req.user
      });
    }
  });
});

app.get("/techlead/:id", ensureAuthenticated, (req, res) => {
  console.log(req.params.id);
  Techlead.findById(req.params.id).exec((err, foundTechlead) => {
    if (err || !foundTechlead) {
      req.flash("error", "Techlead not found");
      res.redirect("back");
    } else {
      res.render("profiletechlead", { techlead: foundTechlead });
    }
  });
});
app.get("/techlead/:id/edit", ensureAuthenticated, (req, res) => {
  Techlead.findById(req.params.id, (err, foundTechlead) => {
    res.render("editT", { techlead: foundTechlead });
  });
});

app.put("/techlead/:id", ensureAuthenticated, (req, res) => {
  console.log(req.body.techlead);
  Techlead.findByIdAndUpdate(
    req.params.id,
    req.body.techlead,
    (err, updatedTechlead) => {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        req.flash("success", "Succesfully updated");
        res.redirect("/techlead/" + req.params.id);
      }
    }
  );
});

app.get("/techlead/:id/leave", (req, res) => {
  Techlead.findById(req.params.id).exec((err, techleadFound) => {
    if (err) {
      req.flash("error", "techlead not found with requested id");
      res.redirect("back");
    } else {
      // console.log(hodFound);
      Employee.find({ department: techleadFound.department })
        .populate("leaves")
        .exec((err, employees) => {
          if (err) {
            req.flash("error", "employee not found with your department");
            res.redirect("back");
          } else {
            res.render("techleadLeaveSign", {
              techlead: techleadFound,
              employees: employees,

              moment: moment
            });
          }
        });
    }
  });
});
app.get("/techlead/:id/leave/:emp_id/info", (req, res) => {
  Techlead.findById(req.params.id).exec((err, techleadFound) => {
    if (err) {
      req.flash("error", "techlead not found with requested id");
      res.redirect("back");
    } else {
      Employee.findById(req.params.emp_id)
        .populate("leaves")
        .exec((err, foundEmployee) => {
          if (err) {
            req.flash("error", "employee not found with this id");
            res.redirect("back");
          } else {
            res.render("techleadmoreinfoemp", {
              employee: foundEmployee,
              techlead: techleadFound,
              moment: moment
            });
          }
        });
    }
  });
});

app.post("/techlead/:id/leave/:emp_id/info", (req, res) => {
  Techlead.findById(req.params.id).exec((err, techleadFound) => {
    if (err) {
      req.flash("error", "techlead not found with requested id");
      res.redirect("back");
    } else {
      Employee.findById(req.params.emp_id)
        .populate("leaves")
        .exec((err, foundEmployee) => {
          if (err) {
            req.flash("error", "employee not found with this id");
            res.redirect("back");
          } else {
            if (req.body.action === "Approve") {
              foundEmployee.leaves.forEach(function(leave) {
                if (leave.techleadstatus === "pending") {
                  leave.techleadstatus = "approved";

                  leave.save();
                }
              });
            } else {
              console.log("u denied");
              foundEmployee.leaves.forEach(function(leave) {
                if (leave.techleadstatus === "pending") {
                  leave.techleadstatus = "denied";

                  leave.save();
                }
              });
            }
            res.render("techleadmoreinfoemp", {
              employee: foundEmployee,
              techlead: techleadFound,
              moment: moment
            });
          }
        });
    }
  });
});
//logout for student

app.get("/logout", (req, res) => {
  req.logout();
  // req.flash("success", "you are logged out");
  res.redirect("/");
});

const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
