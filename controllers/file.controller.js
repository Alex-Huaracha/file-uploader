import prisma from '../db/prismaClient.js';
import path from 'node:path';
import fs from 'fs/promises';

export const uploadFile = async (req, res, next) => {
  try {
    const { parentId } = req.body;

    const redirectUrl = parentId ? `/folders/${parentId}` : '/dashboard';

    if (!req.file) {
      req.flash('error_msg', 'No file was selected.');
      return res.redirect(redirectUrl);
    }

    const userId = req.user.id;

    const { originalname, mimetype, filename, size, path: filePath } = req.file;

    await prisma.file.create({
      data: {
        name: originalname,
        mimetype: mimetype,
        size: size,
        storageId: filename,
        url: `/${filePath}`,
        userId: userId,
        folderId: parentId || null,
      },
    });

    req.flash('success_msg', 'File uploaded successfully!');
    res.redirect(redirectUrl);
  } catch (err) {
    return next(err);
  }
};

export const getFileDetails = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId: userId,
      },
    });

    if (!file) {
      req.flash('error_msg', 'File not found.');
      return res.redirect('/dashboard');
    }

    res.render('file-details', { file: file });
  } catch (err) {
    return next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId: userId,
      },
    });

    if (!file) {
      req.flash('error_msg', 'File not found.');
      return res.redirect('/dashboard');
    }

    const filePath = path.resolve(
      process.cwd(),
      'uploads',
      userId,
      file.storageId
    );

    res.download(filePath, file.name, (err) => {
      if (err) {
        console.error(err);
        req.flash(
          'error_msg',
          'The file could not be downloaded. It may have been deleted.'
        );
        res.redirect('back');
      }
    });
  } catch (err) {
    return next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId: userId,
      },
    });

    if (!file) {
      req.flash('error_msg', 'File not found or not authorized.');
      return res.redirect('/dashboard');
    }

    const filePath = path.resolve(
      process.cwd(),
      'uploads',
      userId,
      file.storageId
    );

    try {
      await fs.unlink(filePath);
    } catch (fsErr) {
      console.warn(
        `The physical file was not found: ${filePath}, but the record will be deleted.`
      );
    }

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    req.flash('success_msg', 'File deleted successfully!');

    if (file.folderId) {
      res.redirect(`/folders/${file.folderId}`);
    } else {
      res.redirect('/dashboard');
    }
  } catch (err) {
    return next(err);
  }
};

export const renameFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const { newName } = req.body;
    const userId = req.user.id;

    if (!newName) {
      req.flash('error_msg', 'The new name cannot be empty.');
      return res.redirect(`/files/${fileId}`);
    }

    const oldFile = await prisma.file.findUnique({
      where: { id: fileId, userId: userId },
    });

    if (!oldFile) {
      req.flash('error_msg', 'File not found.');
      return res.redirect('/dashboard');
    }

    const oldExtension = path.extname(oldFile.name);
    const finalName = newName + oldExtension;

    await prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        name: finalName,
      },
    });

    req.flash('success_msg', 'File renamed successfully!');
    res.redirect(`/files/${fileId}`);
  } catch (err) {
    return next(err);
  }
};
