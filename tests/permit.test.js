const request = require('supertest');
const createApp = require('../src/app');
const { User } = require('../src/models');

const app = createApp();

const validVehicle = {
  plateNumber: 'ABC-123',
  make: 'Toyota',
  model: 'Corolla',
  color: 'Blue',
  year: 2020,
};

async function registerAndLogin(email, password = 'Passw0rd!') {
  const res = await request(app).post('/api/auth/register').send({ email, password });
  return res.body.token;
}

describe('POST /api/permits', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/permits')
      .send({ collegeStatus: 'student', vehicle: validVehicle });
    expect(res.status).toBe(401);
  });

  it('approves a permit when status matches the authorized record and vehicle details are valid', async () => {
    const token = await registerAndLogin('student@example.edu');

    const res = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ collegeStatus: 'student', vehicle: validVehicle });

    expect(res.status).toBe(201);
    expect(res.body.permit.status).toBe('approved');
    expect(res.body.permit.permitNumber).toMatch(/^STU-\d{4}-[A-F0-9]{8}$/);
  });

  it('rejects (but still records) an application whose declared status does not match the college record', async () => {
    const token = await registerAndLogin('student@example.edu');

    const res = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ collegeStatus: 'staff', vehicle: validVehicle }); // lying about status

    expect(res.status).toBe(200);
    expect(res.body.permit.status).toBe('rejected');
    expect(res.body.permit.rejectionReason).toMatch(/does not match/i);
    expect(res.body.permit.permitNumber).toBeNull();
  });

  it('rejects incomplete vehicle details with field-level validation errors', async () => {
    const token = await registerAndLogin('staff@example.edu');

    const res = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ collegeStatus: 'staff', vehicle: { make: 'Honda' } }); // missing plate/model/color/year

    expect(res.status).toBe(422);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['vehicle.plateNumber', 'vehicle.model', 'vehicle.color', 'vehicle.year'])
    );
  });

  it('rejects an invalid vehicle year', async () => {
    const token = await registerAndLogin('staff@example.edu');

    const res = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ collegeStatus: 'staff', vehicle: { ...validVehicle, year: 1899 } });

    expect(res.status).toBe(422);
  });

  it('rejects an invalid college status value outright', async () => {
    const token = await registerAndLogin('staff@example.edu');

    const res = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ collegeStatus: 'professor', vehicle: validVehicle });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/permits/me and /api/permits/:id', () => {
  it('only returns the requesting user\'s own permits', async () => {
    const studentToken = await registerAndLogin('student@example.edu');
    const staffToken = await registerAndLogin('staff@example.edu');

    await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ collegeStatus: 'student', vehicle: validVehicle });

    const staffList = await request(app)
      .get('/api/permits/me')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(staffList.status).toBe(200);
    expect(staffList.body.permits).toHaveLength(0);
  });

  it('forbids fetching another user\'s permit by id', async () => {
    const studentToken = await registerAndLogin('student@example.edu');
    const staffToken = await registerAndLogin('staff@example.edu');

    const created = await request(app)
      .post('/api/permits')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ collegeStatus: 'student', vehicle: validVehicle });

    const res = await request(app)
      .get(`/api/permits/${created.body.permit.id}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Admin routes', () => {
  it('forbids a non-admin user', async () => {
    const token = await registerAndLogin('staff@example.edu');
    const res = await request(app).get('/api/admin/permits').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows a user flagged isAdmin in the database', async () => {
    const token = await registerAndLogin('staff@example.edu');
    await User.update({ isAdmin: true }, { where: { email: 'staff@example.edu' } });

    const res = await request(app).get('/api/admin/permits').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permits)).toBe(true);
  });
});
