import { Router } from 'express';
import { ensureAuthenticated } from '../middleware/auth';
import { createFolder, getFolderById, listFoldersForUser } from '../services/folderService';

const router = Router();

// List all folders for a user
router.get('/', ensureAuthenticated, async (req, res) => {
  const folders = await listFoldersForUser(req.user.id);
  res.render('dashboard', { folders });
});

// View a single folder
router.get('/:id', ensureAuthenticated, async (req, res) => {
  const folder = await getFolderById(Number(req.params.id));
  if (!folder) return res.status(404).send('Folder not found');
  res.render('folder', { folder });
});

// Create a new folder
router.post('/create', ensureAuthenticated, async (req, res) => {
  await createFolder(req.body.name, req.user.id);
  res.redirect('/folders');
});

export default router;
