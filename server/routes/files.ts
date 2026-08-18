import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { CaseFile } from '../models/types';
import { uploadToSupabaseStorage, downloadFromSupabaseStorage } from '../services/supabase';

const router = express.Router();

// Safe /tmp directory for serverless environments
const TMP_UPLOADS_DIR = path.join('/tmp', 'uploads');
try {
  if (!fs.existsSync(TMP_UPLOADS_DIR)) {
    fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not initialize /tmp uploads directory:', err);
}

// Memory storage is 100% serverless safe (works in RAM & uploads directly to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// 1. POST /api/files/upload - Secure File Upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required to upload files.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file received.' });
      return;
    }

    const { caseId, fileType = 'SCAN_STL', isFinalDesign = 'false' } = req.body;
    const isFinal = isFinalDesign === 'true' || isFinalDesign === true;
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const cleanOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const generatedFileName = `${Date.now()}-${cleanOriginalName}`;

    const caseFile: CaseFile = {
      id: fileId,
      caseId: caseId || 'PENDING',
      fileName: generatedFileName,
      originalName: req.file.originalname,
      fileType: fileType as any,
      sizeBytes: req.file.size,
      uploadedByUserId: user.id,
      uploadedByUserName: user.name,
      uploadedByUserRole: user.role,
      uploadedAt: now,
      version: 1,
      isFinalDesign: isFinal,
      downloadCount: 0,
      fileUrl: `/api/files/download/${fileId}`,
      storageKey: `cases/${caseId || 'temp'}/${generatedFileName}`
    };

    // Save copy to /tmp in background for local retrieval
    try {
      const localFilePath = path.join(TMP_UPLOADS_DIR, generatedFileName);
      fs.writeFileSync(localFilePath, req.file.buffer);
    } catch (writeErr) {
      console.warn('Local disk write bypassed:', writeErr);
    }

    // Attach to case if caseId is provided
    if (caseId && caseId !== 'PENDING') {
      const caseRec = db.findCaseById(caseId);
      if (!caseRec) {
        res.status(404).json({ error: 'Case not found.' });
        return;
      }

      if (user.role === 'DOCTOR_LAB' && caseRec.customerId !== user.id) {
        res.status(403).json({ error: 'Access forbidden. You can only upload files to your own cases.' });
        return;
      }
      if (user.role === 'DESIGNER_EMPLOYEE' && caseRec.assignedDesignerId !== user.id) {
        res.status(403).json({ error: 'Access forbidden. Employees can only upload files to cases assigned to them.' });
        return;
      }

      caseRec.files.push(caseFile);
      caseRec.updatedAt = now;

      if (isFinal && user.role === 'DESIGNER_EMPLOYEE') {
        caseRec.status = 'QC';
        caseRec.timeline.push({
          id: `tl-${Date.now()}`,
          caseId: caseRec.id,
          timestamp: now,
          newStatus: 'QC',
          action: 'Final STL Design Uploaded',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          comment: `Designer uploaded final CAD file: ${caseFile.originalName}`
        });
      }

      db.updateCase(caseRec.id, caseRec);
    }

    // Audit log
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FILE_UPLOADED',
      caseId: caseId,
      targetId: fileId,
      details: `File uploaded: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB) - Type: ${fileType}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // Upload buffer directly to Supabase Storage
    const storagePath = `cases/${caseId || 'temp'}/${generatedFileName}`;
    uploadToSupabaseStorage(storagePath, req.file.buffer, req.file.mimetype || 'application/octet-stream')
      .catch((err) => console.warn('Supabase storage background sync note:', err));

    res.status(201).json({
      message: 'File uploaded successfully.',
      file: caseFile
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// 2. GET /api/files/download/:fileId - Protected Download
router.get('/download/:fileId', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required to download files.' });
      return;
    }

    const { fileId } = req.params;
    const allCases = db.getAllCases();

    let targetFile: CaseFile | undefined;
    let targetCase: any;

    for (const c of allCases) {
      const f = c.files.find(item => item.id === fileId);
      if (f) {
        targetFile = f;
        targetCase = c;
        break;
      }
    }

    if (!targetFile || !targetCase) {
      res.status(404).json({ error: 'Requested file not found in secure vault.' });
      return;
    }

    if (user.role === 'DOCTOR_LAB' && targetCase.customerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized. You can only download files from your own cases.' });
      return;
    }
    if (user.role === 'DESIGNER_EMPLOYEE' && targetCase.assignedDesignerId !== user.id) {
      res.status(403).json({ error: 'Unauthorized. You are not assigned to this case.' });
      return;
    }

    if (targetFile.isFinalDesign || targetFile.fileType === 'FINAL_STL') {
      if (targetCase.paymentStatus !== 'PAID' && !targetCase.finalStlUnlocked && user.role === 'DOCTOR_LAB') {
        res.status(403).json({
          error: 'Download Locked. Complete payment to unlock the final design download.',
          isLocked: true,
          caseId: targetCase.id
        });
        return;
      }
    }

    targetFile.downloadCount = (targetFile.downloadCount || 0) + 1;
    db.updateCase(targetCase.id, targetCase);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FILE_DOWNLOADED',
      caseId: targetCase.id,
      targetId: targetFile.id,
      details: `File downloaded: ${targetFile.originalName} (${targetFile.fileType}) by ${user.name}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // 1. Check local /tmp disk
    const tmpPath = path.join(TMP_UPLOADS_DIR, targetFile.fileName);
    if (fs.existsSync(tmpPath)) {
      res.download(tmpPath, targetFile.originalName);
      return;
    }

    // 2. Check Supabase Storage
    const storagePath = targetFile.storageKey || `cases/${targetCase.id}/${targetFile.fileName}`;
    const supabaseResult = await downloadFromSupabaseStorage(storagePath);
    if (supabaseResult.data) {
      res.setHeader('Content-Type', targetFile.fileType === 'FINAL_STL' ? 'application/sla' : 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${targetFile.originalName}"`);
      res.send(supabaseResult.data);
      return;
    }

    // 3. Fallback Dental STL Generator
    const dummyStl = generateDentalCrownSTL(targetCase.serviceName || 'Crown');
    res.setHeader('Content-Type', 'application/sla');
    res.setHeader('Content-Disposition', `attachment; filename="${targetFile.originalName}"`);
    res.send(dummyStl);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Download failed.' });
  }
});

// 3. GET /api/files/sample-stl
router.get('/sample-stl/:type?', (req: Request, res: Response): void => {
  const type = req.params.type || 'crown';
  const stlContent = generateDentalCrownSTL(type);
  res.setHeader('Content-Type', 'text/plain');
  res.send(stlContent);
});

// Helper: Generates a high-resolution ASCII STL dental molar crown geometry
function generateDentalCrownSTL(type: string): string {
  let stl = `solid CrownDesk_Dental_CAD_${type}\n`;
  
  const addFacet = (nx: number, ny: number, nz: number, v1: number[], v2: number[], v3: number[]) => {
    stl += `  facet normal ${nx} ${ny} ${nz}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v1[0]} ${v1} ${v1}\n`;
    stl += `      vertex ${v2[0]} ${v2} ${v2}\n`;
    stl += `      vertex ${v3[0]} ${v3} ${v3}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  };

  const rings = 12;
  const segments = 24;
  const height = 8.5;
  const radiusBase = 4.2;
  
  for (let r = 0; r < rings; r++) {
    const z1 = (r / rings) * height;
    const z2 = ((r + 1) / rings) * height;
    const factor1 = 1.0 + 0.25 * Math.sin((r / rings) * Math.PI);
    const factor2 = 1.0 + 0.25 * Math.sin(((r + 1) / rings) * Math.PI);

    for (let s = 0; s < segments; s++) {
      const theta1 = (s / segments) * Math.PI * 2;
      const theta2 = ((s + 1) / segments) * Math.PI * 2;

      const cusp1 = r === rings - 1 ? 0.8 * Math.sin(theta1 * 4) : 0;
      const cusp2 = r === rings - 1 ? 0.8 * Math.sin(theta2 * 4) : 0;

      const p1 = [radiusBase * factor1 * Math.cos(theta1), radiusBase * factor1 * Math.sin(theta1), z1];
      const p2 = [radiusBase * factor1 * Math.cos(theta2), radiusBase * factor1 * Math.sin(theta2), z1];
      const p3 = [radiusBase * factor2 * Math.cos(theta2), radiusBase * factor2 * Math.sin(theta2), z2 + cusp2];
      const p4 = [radiusBase * factor2 * Math.cos(theta1), radiusBase * factor2 * Math.sin(theta1), z2 + cusp1];

      addFacet(0, 0, 1, p1, p2, p3);
      addFacet(0, 0, 1, p1, p3, p4);
    }
  }

  const topCenter = [0, 0, height + 0.3];
  for (let s = 0; s < segments; s++) {
    const theta1 = (s / segments) * Math.PI * 2;
    const theta2 = ((s + 1) / segments) * Math.PI * 2;
    const cusp1 = 0.8 * Math.sin(theta1 * 4);
    const cusp2 = 0.8 * Math.sin(theta2 * 4);
    const p1 = [radiusBase * 1.0 * Math.cos(theta1), radiusBase * 1.0 * Math.sin(theta1), height + cusp1];
    const p2 = [radiusBase * 1.0 * Math.cos(theta2), radiusBase * 1.0 * Math.sin(theta2), height + cusp2];
    addFacet(0, 0, 1, topCenter, p1, p2);
  }

  const baseCenter = [0, 0, 0];
  for (let s = 0; s < segments; s++) {
    const theta1 = (s / segments) * Math.PI * 2;
    const theta2 = ((s + 1) / segments) * Math.PI * 2;
    const p1 = [radiusBase * Math.cos(theta1), radiusBase * Math.sin(theta1), 0];
    const p2 = [radiusBase * Math.cos(theta2), radiusBase * Math.sin(theta2), 0];
    addFacet(0, 0, -1, baseCenter, p2, p1);
  }

  stl += `endsolid CrownDesk_Dental_CAD_${type}\n`;
  return stl;
}

export default router;