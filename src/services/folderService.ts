import prisma from '../db';

export const createFolder = async (name: string, userId: number) => {
  return prisma.folder.create({
    data: { name, userId },
  });
};

export const getFolderById = async (id: number) => {
  return prisma.folder.findUnique({
    where: { id },
    include: { files: true },
  });
};

export const listFoldersForUser = async (userId: number) => {
  return prisma.folder.findMany({
    where: { userId },
    include: { files: true },
  });
};

export const updateFolderName = async (id: number, newName: string) => {
  return prisma.folder.update({
    where: { id },
    data: { name: newName },
  });
};

export const deleteFolder = async (id: number) => {
  return prisma.folder.delete({ where: { id } });
};
