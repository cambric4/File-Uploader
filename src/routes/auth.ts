import { Router } from 'express';
import passport from '../config/passport';
import prisma from '../db';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/login', (req, res) => res.render('login'));
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
}));

router.get('/register', (req, res) => res.render('register'));
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed } });
  res.redirect('/login');
});

router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/login'));
});

export default router;
