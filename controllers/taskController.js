
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
const pool = require('../db/pg-pool');

async function create(req, res, next) {
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
      [value.title, value.isCompleted, global.user_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

async function index(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE user_id = $1
       ORDER BY id`,
      [global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No tasks found',
      });
    }

    return res.status(200).json(result.rows);
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
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [id, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json(result.rows[0]);
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
    const updates = [];
    const values = [];

    if (value.title !== undefined) {
      values.push(value.title);
      updates.push(`title = $${values.length}`);
    }

    if (value.isCompleted !== undefined) {
      values.push(value.isCompleted);
      updates.push(`is_completed = $${values.length}`);
    }

    values.push(id);
    const idPosition = values.length;

    values.push(global.user_id);
    const userPosition = values.length;

    const result = await pool.query(
      `UPDATE tasks
       SET ${updates.join(', ')}
       WHERE id = $${idPosition} AND user_id = $${userPosition}
       RETURNING id, title, is_completed`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
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
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed`,
      [id, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json(result.rows[0]);
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
};
