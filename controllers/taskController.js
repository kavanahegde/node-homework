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
        priority: value.priority,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

async function index(req, res, next) {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        error: 'Invalid pagination parameters',
      });
    }

    const whereClause = {
      userId: req.user.id,
    };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: 'insensitive',
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          priority: true,
          createdAt: true,
          User: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

const pages = Math.ceil(total / limit);

    return res.status(200).json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
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
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json(task);
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
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
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
    await prisma.task.delete({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return next(err);
  }
}

async function bulkCreate(req, res, next) {
  const tasks = req.body && req.body.tasks;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: 'Tasks must be a non-empty array',
    });
  }

  const validatedTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    validatedTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validatedTasks,
    });

    return res.status(201).json({
      message: 'success!',
      tasksCreated: result.count,
      totalRequested: tasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
};
