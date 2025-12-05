import prisma from '../db';

export const createFile = async (name: string, size: number, path: string, folderId: number) => {
  return prisma.file.create({
    data: { name, size, path, folderId },
  });
};

export const getFileById = async (id: number) => {
  return prisma.file.findUnique({ where: { id } });
};

export const listFilesInFolder = async (folderId: number) => {
  return prisma.file.findMany({ where: { folderId } });
};

export const deleteFile = async (id: number) => {
  return prisma.file.delete({ where: { id } });
};
