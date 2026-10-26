
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
require('../util/memoryStore');

// Keep the counter at module level so deleting tasks does not reset IDs.
let nextTaskId = 1;

// Helper to generate a unique, incrementing task ID.
function taskCounter() {
  return nextTaskId++;
}

function create(req, res) {
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  const task = {
    id: taskCounter(),
    title: value.title,
    isCompleted: value.isCompleted,
    userId: global.user_id.email,
  };

  global.tasks.push(task);

  const { userId, ...responseTask } = task;

  return res.status(201).json(responseTask);
}

function index(req, res) {
  const tasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email
  );

  if (tasks.length === 0) {
    return res.status(404).json({
      error: 'No tasks found',
    });
  }

  return res.status(200).json(
    tasks.map(({ userId, ...task }) => task)
  );
}

function show(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  const task = global.tasks.find(
    (item) =>
      item.id === id &&
      item.userId === global.user_id.email
  );

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
    });
  }

  const { userId, ...responseTask } = task;

  return res.status(200).json(responseTask);
}

function update(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  const { error, value } = patchTaskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  const task = global.tasks.find(
    (item) =>
      item.id === id &&
      item.userId === global.user_id.email
  );

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
    });
  }

  Object.assign(task, value);

  const { userId, ...responseTask } = task;

  return res.status(200).json(responseTask);
}

function deleteTask(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  const taskIndex = global.tasks.findIndex(
    (item) =>
      item.id === id &&
      item.userId === global.user_id.email
  );

  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Task not found',
    });
  }

  global.tasks.splice(taskIndex, 1);

  return res.status(200).json({
    message: 'Task deleted successfully',
  });
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
