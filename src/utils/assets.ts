import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';

export async function copyAssetToFolder(context: vscode.ExtensionContext, assetRelativePath: string, targetFolder: string): Promise<boolean> {
  try {
    const srcPath = path.join(context.extensionPath, assetRelativePath);
    const destPath = path.join(targetFolder, path.basename(assetRelativePath));

    const data = await fs.readFile(srcPath);
    await fs.writeFile(destPath, data);
    return true;
  } catch (err) {
    console.error('Failed to copy asset', assetRelativePath, 'to', targetFolder, err);
    return false;
  }
}
