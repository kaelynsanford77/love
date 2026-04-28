import { Router } from 'express';

const router = Router();

const NPM_REGISTRY = 'https://registry.npmjs.org';

// GET /api/npm/search?q=
router.get('/search', async (req, res) => {
  try {
    const { q, size = '10' } = req.query as any;
    if (!q) return res.status(400).json({ error: 'q is required' });

    const response = await fetch(`${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(q)}&size=${size}`);
    const data = await response.json() as any;

    const packages = data.objects?.map((obj: any) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description,
      keywords: obj.package.keywords,
      links: obj.package.links,
      score: obj.score,
    })) || [];

    res.json({ packages, total: data.total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/npm/info/:package
router.get('/info/:package(*)', async (req, res) => {
  try {
    const packageName = req.params.package;
    const response = await fetch(`${NPM_REGISTRY}/${packageName}`);
    if (!response.ok) return res.status(404).json({ error: 'Package not found' });

    const data = await response.json() as any;
    const latest = data['dist-tags']?.latest;
    const version = data.versions?.[latest] || {};

    res.json({
      name: data.name,
      description: data.description,
      version: latest,
      homepage: data.homepage,
      repository: data.repository,
      license: data.license,
      keywords: data.keywords,
      peerDependencies: version.peerDependencies,
      dependencies: version.dependencies,
      versions: Object.keys(data.versions || {}).reverse().slice(0, 20),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
