const storedUsers = [];
const storedTasks = [];

global.users = storedUsers;
global.tasks = storedTasks;
global.user_id = null;

function setLoggedOnUser(user) {
  global.user_id = user;
}

function getLoggedOnUser() {
  return global.user_id;
}

module.exports = {
  storedUsers,
  storedTasks,
  setLoggedOnUser,
  getLoggedOnUser,
};
