const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
const prisma = require('../db/prisma');

async function create(req, res, next) {
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
    });
  } catch (err) {
    return next(err);
  }
}

async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        error: 'No tasks found',
      });
    }

    return res.status(200).json(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        isCompleted: task.isCompleted,
      }))
    );
  } catch (err) {
    return next(err);
  }
}

async function show(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
    });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
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

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return next(err);
  }
}

async function deleteTask(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid task ID',
    });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
