const loki = require("lokijs");
const db = new loki("store.db", {
  autoload: true,
  autoloadCallback: databaseInitialize,
  //autosave: true,
  //autosaveInterval: 4000,
});
let _isLoaded = false;
db.addListener("loaded", () => (_isLoaded = true));

const isLoaded = () =>
  new Promise((res, rej) => {
    let cleanPromise = () => {
      db.events["loaded"].length = 0;
      res(true);
    };

    if (_isLoaded) cleanPromise();
    else db.addListener("loaded", cleanPromise);
    setTimeout(() => rej(false), 5000);
  });

function databaseInitialize() {
  let users = db.getCollection("users");
  let projects = db.getCollection("projects");
  if (users === null) {
    users = db.addCollection("users", { unique: "project" });
  }
  if (projects === null) {
    projects = db.addCollection("projects", { unique: "project" });
  }
}

const addUser = (user, project) =>
  db.getCollection("users").insertOne({ user, project });

const updateOwner = (user, project) => {
  db.getCollection("users").updateWhere(
    (data) => data.project === project,
    (row) => {
      row.user = user;
      return row;
    }
  );
};

const addProject = async (project) =>
  db.getCollection("projects").insertOne(project);

const removeProject = (project) => db.getCollection("projects").remove(project);

const getProjects = () => db.getCollection("projects").find();

const persist = (fn) => db.save(fn);

module.exports = {
  _db: db,
  isLoaded,
  addUser,
  updateOwner,
  getProjects,
  addProject,
  removeProject,
  persist,
};
