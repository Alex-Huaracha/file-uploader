import prisma from '../db/prismaClient.js';
import path from 'node:path';

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
