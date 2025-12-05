import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import prisma from '../db';

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return done(null, false, { message: 'No user found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'Wrong password' });

    return done(null, user);
  }
));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

export default passport;
