import { type IRouter, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: IRouter = Router();

// POST /api/preview/share
router.post('/share', (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    // Generate a shareable token
    const token = uuidv4();
    const shareUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/share/${token}`;

    res.json({ token, url: shareUrl, projectId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
