import express from 'express';
import { getContainerIdFromRedis, execCommand, getDockerFileTree, moveFile } from './wsUtils';

const router = express.Router();

router.post('/', async (req, res) => {
  const { type, broadcastingRoomId, payload } = req.body;

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
      case 'addFile': {
        const checkPath = `${payload.parentPath.replace(/\/$/, '')}/${payload.name}`;
        try {
          await execCommand(containerId, ['sh', '-c', `[ -e "${checkPath}" ]`]);
          return res.status(400).json({
            success: false,
            message: '同名のファイルまたはフォルダがすでに存在します。',
          });
        } catch {
          await execCommand(containerId, ['sh', '-c', `touch "${checkPath}"`]);
        }
        break;
      }
      case 'addFolder': {
        const checkPath = `${payload.parentPath.replace(/\/$/, '')}/${payload.name}`;
        try {
          await execCommand(containerId, ['sh', '-c', `[ -e "${checkPath}" ]`]);
          return res.status(400).json({
            success: false,
            message: '同名のファイルまたはフォルダがすでに存在します。',
          });          
        } catch {
          await execCommand(containerId, ['sh', '-c', `mkdir -p "${checkPath}"`]);
        }
        break;
      }
      case 'rename': {
        const newPath = payload.oldPath.replace(/[^/]+$/, payload.newName);
        try {
          await execCommand(containerId, ['sh', '-c', `[ -e "${newPath}" ]`]);
          return res.status(400).json({
            success: false,
            message: '同名のファイルまたはフォルダがすでに存在します。',
          });
          
        } catch {
          await moveFile(containerId, payload.oldPath, newPath);
        }
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
    const errMsg = (error instanceof Error) ? error.message : String(error);
    console.error('fs-operation error:', errMsg);
    res.status(500).json({
      success: false,
      message: errMsg,
    });
  }  
});

export default router;
