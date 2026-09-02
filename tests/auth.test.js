const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

describe('POST /api/auth/register', () => {
  it('creates an account when the email is on the active authorized list', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('student@example.edu');
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.isAdmin).toBe(false);
  });

  it('rejects an email that is not on the authorized list', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'stranger@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(403);
  });

  it('rejects an email whose authorization has been revoked', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'revoked@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(403);
  });

  it('rejects a weak password before ever consulting the authorized list', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'staff@example.edu', password: '123' });

    expect(res.status).toBe(422);
  });

  it('rejects a duplicate registration for the same email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'staff@example.edu', password: 'Passw0rd!' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'staff@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(409);
  });

  it('ignores a client-supplied role/isAdmin and always uses the authorized-list role', async () => {
    // A malicious or buggy client tries to grant itself staff/admin access.
    const res = await request(app).post('/api/auth/register').send({
      email: 'student@example.edu',
      password: 'Passw0rd!',
      role: 'staff',
      isAdmin: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student'); // from AuthorizedUser, not the request body
    expect(res.body.user.isAdmin).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'staff@example.edu', password: 'Passw0rd!' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('staff');
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@example.edu', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('rejects an email with no account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.edu', password: 'Passw0rd!' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user profile for a valid token', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ email: 'staff@example.edu', password: 'Passw0rd!' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${register.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('staff@example.edu');
  });

  it('rejects a garbage/invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
