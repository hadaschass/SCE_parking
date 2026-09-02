'use strict';

// Demo / development seed data only.
// These are fictional people at a fictional domain (@example.edu) used so
// the app is runnable out of the box. Replace or clear this table with the
// college's real authorized-user export before using this system for real
// students/employees — see README.md "Database setup" section.
module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('authorized_users', [
      {
        email: 'alice.staff@example.edu',
        full_name: 'Alice Anderson',
        role: 'staff',
        department: 'Registrar Office',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: 'ben.staff@example.edu',
        full_name: 'Ben Brown',
        role: 'staff',
        department: 'Facilities',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: 'carla.student@example.edu',
        full_name: 'Carla Chen',
        role: 'student',
        department: 'Computer Science',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: 'dan.student@example.edu',
        full_name: 'Dan Davis',
        role: 'student',
        department: 'Mechanical Engineering',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        email: 'inactive.former@example.edu',
        full_name: 'Ivy Ingram',
        role: 'student',
        department: 'Biology',
        // Demonstrates a revoked authorization (e.g. graduated/left) that
        // must still be rejected even though the row exists.
        is_active: false,
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('authorized_users', null, {});
  },
};
