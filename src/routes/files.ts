import { Router } from 'express';
import { upload } from '../middleware/upload';
import { ensureAuthenticated } from '../middleware/auth';
import { createFile, getFileById } from '../services/fileService';

const router = Router();

// View file details
router.get('/:id', ensureAuthenticated, async (req, res) => {
  const file = await getFileById(Number(req.params.id));
  if (!file) return res.status(404).send('File not found');
  res.render('file', { file });
});

// Upload file
router.post('/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
  const { filename, size, path } = req.file!;
  const folderId = Number(req.body.folderId);

  await createFile(filename, size, path, folderId);
  res.redirect('/folders/' + folderId);
});

export default router;
