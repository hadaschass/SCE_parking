const { sequelize, AuthorizedUser } = require('../src/models');

// Fresh in-memory database per test, seeded with a small known
// authorized-user list so tests are deterministic and isolated.
beforeEach(async () => {
  await sequelize.sync({ force: true });
  await AuthorizedUser.bulkCreate([
    { email: 'staff@example.edu', fullName: 'Test Staff', role: 'staff', isActive: true },
    { email: 'student@example.edu', fullName: 'Test Student', role: 'student', isActive: true },
    { email: 'revoked@example.edu', fullName: 'Test Revoked', role: 'student', isActive: false },
  ]);
});

afterAll(async () => {
  await sequelize.close();
});
