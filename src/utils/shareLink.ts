import { v4 as uuid } from 'uuid';
import prisma from '../db';

export const createShareLink = async (folderId: number, days: number) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const link = await prisma.sharedLink.create({
    data: { folderId, expiresAt },
  });

  return `https://yourapp.com/share/${link.id}`;
};
