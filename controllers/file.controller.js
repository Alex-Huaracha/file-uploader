import prisma from '../db/prismaClient.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
