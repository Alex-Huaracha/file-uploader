import prisma from '../db/prismaClient.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export const postFolder = async (req, res, next) => {
  try {
    const { folderName, parentId } = req.body;
    const userId = req.user.id;

    if (!folderName) {
      req.flash('error_msg', 'Folder name cannot be empty.');
      return res.redirect(parentId ? `/folders/${parentId}` : '/dashboard');
    }

    await prisma.folder.create({
      data: {
        name: folderName,
        userId: userId,
        parentId: parentId || null,
      },
    });

    req.flash('success_msg', 'Folder created successfully!');
    res.redirect(parentId ? `/folders/${parentId}` : '/dashboard');
  } catch (err) {
    return next(err);
  }
};

export const getFolderById = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    const currentFolder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: userId,
      },
    });

    if (!currentFolder) {
      req.flash('error_msg', 'Folder not found.');
      return res.redirect('/dashboard');
    }

    const subFolders = await prisma.folder.findMany({
      where: {
        userId: userId,
        parentId: folderId,
      },
    });

    const files = await prisma.file.findMany({
      where: {
        userId: userId,
        folderId: folderId,
      },
    });

    res.render('folder', {
      user: req.user,
      currentFolder: currentFolder,
      folders: subFolders,
      files: files,
    });
  } catch (err) {
    return next(err);
  }
};

async function deleteFilesInFolder(folderId, userId) {
  const files = await prisma.file.findMany({
    where: { folderId: folderId, userId: userId },
  });

  const deleteFilePromises = files.map((file) => {
    const filePath = path.resolve(
      process.cwd(),
      'uploads',
      userId,
      file.storageId
    );
    return fs.unlink(filePath).catch((err) => {
      console.warn(`Physical file not found: ${filePath}`);
    });
  });
  await Promise.all(deleteFilePromises);

  const subFolders = await prisma.folder.findMany({
    where: { parentId: folderId, userId: userId },
  });

  const deleteSubFolderPromises = subFolders.map((subFolder) =>
    deleteFilesInFolder(subFolder.id, userId)
  );
  await Promise.all(deleteSubFolderPromises);
}

export const deleteFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const userId = req.user.id;

    const folder = await prisma.folder.findUnique({
      where: { id: folderId, userId: userId },
    });

    if (!folder) {
      req.flash('error_msg', 'Folder not found.');
      return res.redirect('/dashboard');
    }

    await deleteFilesInFolder(folderId, userId);

    await prisma.folder.delete({
      where: { id: folderId },
    });

    req.flash('success_msg', 'Folder and all its contents have been deleted!');

    if (folder.parentId) {
      res.redirect(`/folders/${folder.parentId}`);
    } else {
      res.redirect('/dashboard');
    }
  } catch (err) {
    return next(err);
  }
};

export const renameFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id;
    const { newName } = req.body;
    const userId = req.user.id;

    if (!newName) {
      req.flash('error_msg', 'The new name cannot be empty.');
      return res.redirect(`/folders/${folderId}`);
    }

    await prisma.folder.update({
      where: {
        id: folderId,
        userId: userId,
      },
      data: {
        name: newName,
      },
    });

    req.flash('success_msg', 'Folder renamed successfully!');
    res.redirect(`/folders/${folderId}`);
  } catch (err) {
    return next(err);
  }
};
