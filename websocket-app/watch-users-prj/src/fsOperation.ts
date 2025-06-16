import express from 'express';
import {
  getContainerIdFromRedis,
  execCommand,
  getDockerFileTree,
  moveFile,
} from './wsUtils';

const router = express.Router();

router.post('/', async (req, res) => {
  const { type, broadcastingRoomId, payload } = req.body;
  console.log(payload);
  if (!broadcastingRoomId || !type || !payload) {
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }

  try {
    const redis = req.app.locals.redis;
    const containerId = await getContainerIdFromRedis(redis, broadcastingRoomId);

    if (!containerId) {
      return res.status(400).json({ success: false, message: 'Container ID not found' });
    }

    switch (type) {
      case 'addFile':
        await execCommand(containerId, ['sh', '-c', `touch "${payload.parentPath}/${payload.name}"`]);
        break;

      case 'addFolder':
        await execCommand(containerId, ['sh', '-c', `mkdir -p "${payload.parentPath}/${payload.name}"`]);
        break;

      case 'rename': {
        const newPath = payload.oldPath.replace(/[^/]+$/, payload.newName);
        await moveFile(containerId, payload.oldPath, newPath);
        break;
      }

      case 'delete': {
        const cmd = payload.isFolder
          ? `rm -rf "${payload.path}"`
          : `rm -f "${payload.path}"`;
        await execCommand(containerId, ['sh', '-c', cmd]);
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Unknown operation type' });
    }

    const updatedTree = await getDockerFileTree(containerId, '/root');

    res.json({
      success: true,
      updatedTree,
    });
    } catch (error) {
        console.error('fs-operation error:', (error as Error).message);
        res.status(500).json({
        success: false,
        message: (error as Error).message,
        });
    }
});

export default router;
