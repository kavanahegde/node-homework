const prisma = require('../db/prisma');

async function getUserAnalytics(req, res, next) {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId },
      _count: { id: true },
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });

    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
}

async function getUsersWithStats(req, res, next) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  try {
    const [usersRaw, totalUsers] = await Promise.all([
      prisma.user.findMany({
        include: {
          Task: {
            where: { isCompleted: false },
            select: {
              id: true,
              title: true,
              priority: true,
              createdAt: true,
            },
            take: 5,
          },
          _count: {
            select: {
              Task: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));

    const pages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function searchTasks(req, res, next) {
  const searchQuery = typeof req.query.q === 'string'
    ? req.query.q.trim()
    : '';

  if (searchQuery.length < 2) {
    return res.status(400).json({
      error: 'Search query must be at least 2 characters long',
    });
  }

  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit parameter' });
  }

  try {
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    const searchResults = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      results: searchResults,
      query: searchQuery,
      count: searchResults.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
};
